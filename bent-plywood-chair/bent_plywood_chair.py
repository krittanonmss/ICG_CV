import bpy
import math
from mathutils import Vector


# ------------------------------------------------------------
# Bent plywood chair - shape only
# Run in Blender: Scripting > New/Open > Run Script
# ------------------------------------------------------------

CHAIR_WIDTH = 1.75
SHELL_THICKNESS = 0.16
BEVEL_SIZE = 0.055


def bezier(p0, p1, p2, p3, steps):
    """Return points on a cubic Bezier curve in the Y-Z plane."""
    result = []
    for i in range(steps):
        t = i / steps
        u = 1.0 - t
        y = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        z = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        result.append(Vector((y, z)))
    return result


def make_bent_shell():
    # Center line: backrest -> seat -> front leg.
    # Coordinates are (Y, Z); +Y is the front of the chair.
    points = []
    points += bezier(
        (-0.72, 4.05), (-0.78, 3.45), (-0.62, 2.45), (-0.45, 2.18), 18
    )
    points += bezier(
        (-0.45, 2.18), (-0.25, 1.98), (0.62, 2.04), (0.86, 1.98), 18
    )
    points += bezier(
        (0.86, 1.98), (1.08, 1.88), (1.08, 0.58), (1.18, 0.10), 20
    )
    points.append(Vector((1.18, 0.10)))

    # A rectangular strip swept along the curve.
    verts = []
    for i, p in enumerate(points):
        if i == 0:
            tangent = points[1] - points[0]
        elif i == len(points) - 1:
            tangent = points[-1] - points[-2]
        else:
            tangent = points[i + 1] - points[i - 1]
        tangent.normalize()
        normal = Vector((-tangent.y, tangent.x))

        for x in (-CHAIR_WIDTH / 2, CHAIR_WIDTH / 2):
            for side in (-1, 1):
                q = p + normal * (SHELL_THICKNESS * 0.5 * side)
                verts.append((x, q.x, q.y))

    faces = []
    rings = len(points)
    # Vertex order in each ring: left-, left+, right-, right+
    for i in range(rings - 1):
        a, b = i * 4, (i + 1) * 4
        faces += [
            (a + 0, b + 0, b + 1, a + 1),  # left edge
            (a + 2, a + 3, b + 3, b + 2),  # right edge
            (a + 1, b + 1, b + 3, a + 3),  # outer face
            (a + 0, a + 2, b + 2, b + 0),  # inner face
        ]
    faces += [
        (0, 1, 3, 2),
        ((rings-1)*4, (rings-1)*4+2, (rings-1)*4+3, (rings-1)*4+1),
    ]

    mesh = bpy.data.meshes.new("Bent shell mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Bent seat and back", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def make_rear_leg():
    # One wide rear panel instead of two separate legs.  Its upper end overlaps
    # the underside of the seat, so there is no visible gap at the joint.
    top = Vector((0.0, -0.28, 2.08))
    bottom = Vector((0.0, -0.78, 0.10))
    direction = top - bottom
    length = direction.length
    middle = (top + bottom) * 0.5

    bpy.ops.mesh.primitive_cube_add(location=middle)
    leg = bpy.context.object
    leg.name = "Connected rear leg panel"
    leg.dimensions = (CHAIR_WIDTH - 0.18, 0.30, length)
    leg.rotation_mode = 'QUATERNION'
    leg.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return leg


def finish_object(obj):
    bevel = obj.modifiers.new("Soft plywood edges", 'BEVEL')
    bevel.width = BEVEL_SIZE
    bevel.segments = 3
    bevel.limit_method = 'ANGLE'

    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.set_sharp_from_angle(angle=math.radians(35.0))


# Remove the previous generated chair, so the script can be run repeatedly.
for obj in list(bpy.data.objects):
    if obj.get("bent_chair_generated"):
        bpy.data.objects.remove(obj, do_unlink=True)

parts = [
    make_bent_shell(),
    make_rear_leg(),
]

for part in parts:
    part["bent_chair_generated"] = True
    finish_object(part)

# Select the finished chair.
bpy.ops.object.select_all(action='DESELECT')
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]

print("Bent plywood chair created")
