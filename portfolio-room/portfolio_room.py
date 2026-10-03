"""Build an original small room in Blender. Run with Blender in background mode."""
import bpy
import math
from pathlib import Path
from mathutils import Matrix, Vector

OUT = Path(__file__).resolve().parent

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


def mat(name, color, roughness=0.8, metal=0.0, alpha=1.0, emission=None):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, alpha)
    material.use_nodes = True
    surface = material.node_tree.nodes.get('Principled BSDF')
    surface.inputs['Base Color'].default_value = (*color, 1)
    surface.inputs['Roughness'].default_value = roughness
    surface.inputs['Metallic'].default_value = metal
    surface.inputs['Alpha'].default_value = alpha
    if emission:
        surface.inputs['Emission Color'].default_value = (*emission, 1)
        surface.inputs['Emission Strength'].default_value = 1.2
    if alpha < 1:
        material.surface_render_method = 'DITHERED'
    return material


floor_mat = mat('Floor warm white', (0.74, 0.69, 0.67))
wall_mat = mat('Wall pale pink', (0.79, 0.72, 0.72))
wall_inside = mat('Wall inside', (0.92, 0.87, 0.84))
wood = mat('Light wood', (0.72, 0.55, 0.38))
wood_dark = mat('Wood edges', (0.46, 0.33, 0.25))
cream = mat('Cream', (0.90, 0.83, 0.69))
white = mat('Off white', (0.94, 0.93, 0.87))
screen_white = mat('Computer screen pure white', (1.0, 1.0, 1.0), emission=(1.0, 1.0, 1.0))
black = mat('Dark charcoal', (0.08, 0.08, 0.11))
metal = mat('Soft metal', (0.55, 0.55, 0.55), 0.3, 0.65)
alloy = mat('Metallic alloy frame', (0.38, 0.43, 0.48), 0.26, 0.85)
rose = mat('Rose fabric', (0.68, 0.49, 0.50))
rug_mat = mat('Rug blush', (0.82, 0.73, 0.72))
aqua = mat('Aquarium glass', (0.43, 0.73, 0.74), 0.1, 0.0, 0.25)
water = mat('Aquarium water', (0.22, 0.58, 0.70), 0.2, 0.0, 0.45)
blue = mat('Blue object', (0.17, 0.39, 0.58))
yellow = mat('Yellow object', (0.91, 0.70, 0.26))
green = mat('Leaf green', (0.30, 0.52, 0.32))
green_dark = mat('Leaf dark', (0.19, 0.38, 0.25))
purple = mat('Purple light', (0.52, 0.18, 0.79), 0.3, emission=(0.35, 0.05, 0.80))
book_violet = mat('Book violet', (0.49, 0.35, 0.61))
navy = mat('Bed cover navy', (0.08, 0.13, 0.25))
brown = mat('Second chair brown', (0.36, 0.19, 0.10))
black_fabric = mat('Office chair black', (0.07, 0.07, 0.09))
photo_image = bpy.data.images.load(str(OUT.parent / 'my-pic/S__48365570.jpg'))
photo_image.pack()
photo_material = mat('Personal photo texture', (1.0, 1.0, 1.0), roughness=1.0)
photo_texture = photo_material.node_tree.nodes.new('ShaderNodeTexImage')
photo_texture.image = photo_image
photo_material.node_tree.links.new(
    photo_texture.outputs['Color'],
    photo_material.node_tree.nodes.get('Principled BSDF').inputs['Base Color']
)


def box(name, loc, size, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new('Soft corners', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def sphere(name, loc, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return obj


def cylinder(name, loc, radius, depth, material, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def rod(name, start, end, radius, material):
    middle = (Vector(start) + Vector(end)) / 2
    obj = cylinder(name, middle, radius, (Vector(end) - Vector(start)).length, material, 12)
    obj.rotation_euler = (Vector(end) - Vector(start)).to_track_quat('Z', 'Y').to_euler()
    return obj


# Coordinates: north = +Y, east = +X. Every mesh stays inside an 8 x 8 unit floor.
box('Room floor', (0, 0, 0.08), (8, 8, 0.16), floor_mat)
box('Floor surface', (0, 0, 0.17), (7.75, 7.75, 0.04), wall_inside)
box('North wall', (0, 3.91, 1.75), (8, 0.18, 3.5), wall_mat)
box('East wall', (3.91, 0, 1.75), (0.18, 8, 3.5), wall_mat)
box('North wall inside', (0, 3.80, 1.72), (7.75, 0.02, 3.40), wall_inside)
box('East wall inside', (3.80, 0, 1.72), (0.02, 7.75, 3.40), wall_inside)

# Bed: the headboard touches the NORTH (+Y) wall. Mattress length is 4.80.
bed_x = -1.54
bed_y = 1.18
bed_length = 4.80
box('nav_about Bed frame', (bed_x, bed_y, 0.39), (3.20, bed_length, 0.26), wood, 0.04)
for x in (-2.91, -0.17):
    for y in (-0.99, 3.28):
        box('Bed leg', (x, y, 0.20), (0.10, 0.10, 0.35), wood_dark)
box('Bed headboard NORTH wall', (bed_x, 3.70, 1.07), (3.20, 0.17, 1.16), wood)
box('Mattress', (bed_x, bed_y, 0.62), (3.04, 4.61, 0.27), cream, 0.07)
box('nav_about Navy duvet', (bed_x, 1.00, 0.82), (3.00, 4.22, 0.20), navy, 0.10)
for x in (-2.30, -0.78):
    box('nav_about Navy pillow', (x, 2.85, 0.99), (1.30, 0.65, 0.24), navy, 0.10)
box('Long bolster', (-2.56, 0.98, 0.99), (0.42, 1.75, 0.25), navy, 0.09)

# Air-conditioner remote, mounted on the north wall beside the headboard.
box('AC remote body', (-3.46, 3.735, 1.86), (0.22, 0.09, 0.40), white, 0.025)
box('AC remote screen', (-3.46, 3.681, 1.95), (0.15, 0.012, 0.12), black, 0.006)
power = cylinder('AC remote power button', (-3.46, 3.674, 1.77), 0.045, 0.016, green, 20)
power.rotation_euler[0] = math.pi / 2

# Wall-mounted bookshelf above the headboard on the north wall.
box('Bookshelf above bed', (bed_x, 3.56, 2.13), (2.55, 0.48, 0.10), wood, 0.025)
for x in (-2.48, -0.60):
    box('Bookshelf wall bracket', (x, 3.70, 1.92), (0.07, 0.16, 0.36), white)
book_colors = (navy, rose, rose, blue, book_violet, green, wood_dark, yellow, blue, green)
for i, book_color in enumerate(book_colors):
    height = 0.34 + (i % 3) * 0.07
    box(f'Project book {i + 1}', (-2.54 + i * 0.24, 3.52, 2.18 + height / 2),
        (0.19, 0.24, height), book_color, 0.006)

# Desk along the EAST wall. Its long side equals the 4.80-unit bed length.
desk_length = bed_length
box('nav_works Desk top EAST facing', (3.00, 0.75, 1.23), (1.12, desk_length, 0.12), wood, 0.03)
for y in (-1.43, 2.93):
    box('Desk end leg', (3.00, y, 0.68), (1.00, 0.10, 1.04), white)
box('Desk drawer cabinet', (3.03, -1.08, 0.66), (0.88, 0.72, 1.03), cream)
for z in (0.43, 0.72, 1.00):
    box('Desk drawer front', (2.57, -1.08, z), (0.025, 0.62, 0.24), white)
    box('Desk drawer handle', (2.54, -1.08, z), (0.025, 0.18, 0.025), metal)

# Monitor screen faces WEST (-X), so a person at the desk faces EAST (+X).
box('Monitor base', (3.10, 1.26, 1.34), (0.30, 0.48, 0.05), black)
box('Monitor stand', (3.21, 1.26, 1.57), (0.08, 0.07, 0.43), black)
box('nav_works Computer facing EAST', (3.15, 1.26, 1.84), (0.09, 1.07, 0.72), black, 0.025)
box('Computer screen white', (3.09, 1.26, 1.84), (0.01, 0.94, 0.58), screen_white)
box('Keyboard', (2.70, 1.26, 1.32), (0.32, 0.86, 0.04), black)
for row in range(2):
    for col in range(8):
        box('Keyboard key', (2.58 + row * 0.10, 0.92 + col * 0.095, 1.345),
            (0.06, 0.06, 0.006), white)
sphere('Mouse', (2.70, 0.48, 1.32), (0.10, 0.07, 0.035), black)
# Open notebook sits directly on the desk, turned slightly towards the black office chair.
notebook_angle = math.radians(-18)


def notebook_box(name, loc, size, material, bevel=0, lid_tilt=0):
    dx, dy = loc[0] - 2.85, loc[1] + 0.31
    x = 2.92 + dx * math.cos(notebook_angle) - dy * math.sin(notebook_angle)
    y = -0.31 + dx * math.sin(notebook_angle) + dy * math.cos(notebook_angle)
    obj = box(name, (x, y, loc[2] - 0.26), size, material, bevel)
    obj.rotation_euler[1] = math.radians(lid_tilt)
    obj.rotation_euler[2] = notebook_angle
    return obj


notebook_box('nav_works Notebook open base', (2.85, -0.31, 1.59), (0.73, 0.72, 0.07), black, 0.02)
notebook_box('Notebook keyboard', (2.78, -0.31, 1.63), (0.46, 0.59, 0.006), wood_dark)
for row in range(4):
    for col in range(6):
        notebook_box('Notebook key', (2.59 + row * 0.10, -0.55 + col * 0.095, 1.637),
                     (0.07, 0.07, 0.004), metal)
notebook_box('Notebook trackpad', (3.11, -0.31, 1.635), (0.12, 0.23, 0.004), metal)
notebook_box('nav_works Notebook open lid', (3.19, -0.31, 1.94),
             (0.07, 0.74, 0.65), black, 0.02, 12)
notebook_box('Notebook screen facing seat', (3.145, -0.31, 1.94),
             (0.007, 0.65, 0.55), blue, lid_tilt=12)
cylinder('Desk water bottle', (2.72, 1.98, 1.43), 0.08, 0.28, aqua)

# A polished metal sculpture makes the Blender metallic/roughness material visible
# as PBR in the web scene; the wood plinth remains cel shaded with the furniture.
cylinder('PBR sculpture wood plinth', (2.75, -1.15, 1.31), 0.20, 0.06, wood_dark)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.18,
                                     location=(2.75, -1.15, 1.51))
pbr_sphere = bpy.context.object
pbr_sphere.name = 'PBR polished metal desk sphere'
pbr_sphere.data.materials.append(alloy)
bpy.ops.object.shade_smooth()

# The desk frame shows a photo until the site zooms in to its Blender Text.
frame_tilt = math.radians(12)
frame = box('Personal info frame', (3.16, 2.54, 1.57),
            (0.07, 0.43, 0.55), alloy, 0.012)
frame.rotation_euler[1] = frame_tilt
insert = box('Personal info white mat',
             (3.16 - 0.044 * math.cos(frame_tilt), 2.54,
              1.57 + 0.044 * math.sin(frame_tilt)),
             (0.008, 0.34, 0.44), white)
insert.rotation_euler[1] = frame_tilt
photo_mesh = bpy.data.meshes.new('Personal photo plane mesh')
photo_mesh.from_pydata([
    (-0.052, -0.125, -0.22),
    (-0.052, -0.125, 0.22),
    (-0.052, 0.125, 0.22),
    (-0.052, 0.125, -0.22),
], [], [(0, 1, 2, 3)])
photo_mesh.materials.append(photo_material)
uvs = photo_mesh.uv_layers.new(name='UVMap')
for loop, uv in zip(photo_mesh.polygons[0].loop_indices,
                    ((1, 0), (1, 1), (0, 1), (0, 0))):
    uvs.data[loop].uv = uv
photo = bpy.data.objects.new('Personal info photo', photo_mesh)
bpy.context.collection.objects.link(photo)
photo.location = (3.16, 2.54, 1.57)
photo.rotation_euler[1] = frame_tilt
face_rotation = Matrix.Rotation(frame_tilt, 4, 'Y').to_3x3()
text_axes = Matrix(((0, 0, -1), (-1, 0, 0), (0, 1, 0)))
text_rotation = face_rotation @ text_axes
text_center = Vector((3.16, 2.54, 1.57)) + face_rotation @ Vector((-0.058, 0, 0))
thai_font = bpy.data.fonts.load(str(OUT / 'NotoSansThai-Regular.ttf'))
thai_font.pack()
profile_text = 'นาย กฤตานน มุสีสุทธิ์ รหัสนิสิติ 6621650213 คณะศิลปศาสตร์และวิทยาศาสตร์ สาขา วิทยาการคอมพิวเตอร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน'
frame['profile_text'] = profile_text
assert ' '.join((
    'นาย กฤตานน มุสีสุทธิ์',
    'รหัสนิสิติ 6621650213',
    'คณะศิลปศาสตร์และวิทยาศาสตร์',
    'สาขา วิทยาการคอมพิวเตอร์',
    'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน',
)) == profile_text
for label, height, size, left in (
    ('นาย กฤตานน มุสีสุทธิ์', 0.17, 0.042, None),
    ('รหัสนิสิติ', 0.10, 0.033, -0.132),
    ('6621650213', 0.10, 0.033, -0.042),
    ('คณะศิลปศาสตร์และวิทยาศาสตร์', 0.03, 0.031, None),
    ('สาขา วิทยาการคอมพิวเตอร์', -0.04, 0.033, None),
    ('มหาวิทยาลัยเกษตรศาสตร์', -0.11, 0.032, None),
    ('วิทยาเขตกำแพงแสน', -0.18, 0.034, None),
):
    lettering = bpy.data.curves.new(f'Personal info text {label}', 'FONT')
    lettering.body = label
    if label != '6621650213':
        lettering.font = thai_font
    lettering.size = size
    lettering.align_x = 'CENTER' if left is None else 'LEFT'
    lettering.align_y = 'CENTER'
    lettering.extrude = 0.0008
    lettering.materials.append(black)
    text = bpy.data.objects.new(f'Personal info text {label}', lettering)
    bpy.context.collection.objects.link(text)
    text.location = text_center + text_rotation @ Vector((left or 0, height, 0))
    text.rotation_euler = text_rotation.to_euler()
box('Personal info frame foot', (3.34, 2.54, 1.31), (0.20, 0.12, 0.04), black)
support_attach = Vector((3.16, 2.54, 1.57)) + face_rotation @ Vector((0.028, 0, 0))
rod('Personal info frame support', support_attach,
    (3.39, 2.54, 1.33), 0.02, black)

# The air conditioner is mounted high on the EAST (+X) wall.
box('nav_lighting Air conditioner EAST wall', (3.57, -0.65, 3.02), (0.45, 1.67, 0.43), cream, 0.07)
box('AC vent faces WEST', (3.34, -0.65, 2.85), (0.04, 1.42, 0.07), wood_dark)
box('AC green lamp', (3.28, -0.05, 3.09), (0.015, 0.07, 0.04), green)

# Black office chair, facing east towards the computer.
box('nav_chair Office chair seat', (1.75, 1.10, 0.73), (0.75, 0.84, 0.16), black_fabric, 0.07)
box('nav_chair Office chair back', (1.34, 1.10, 1.24), (0.18, 0.84, 1.05), black_fabric, 0.10)
box('Office chair headrest', (1.44, 1.10, 1.79), (0.16, 0.53, 0.20), black_fabric, 0.06)
for y in (0.64, 1.56):
    box('Office chair armrest', (1.72, y, 1.05), (0.65, 0.09, 0.11), black)
    rod('Armrest support', (1.73, y, 0.78), (1.73, y, 1.00), 0.035, black)
rod('Office chair stem', (1.75, 1.10, 0.63), (1.75, 1.10, 0.25), 0.06, metal)
for dx, dy in ((0.39, 0), (-0.39, 0), (0, 0.39), (0, -0.39)):
    rod('Office chair foot', (1.75, 1.10, 0.24), (1.75 + dx, 1.10 + dy, 0.20), 0.03, black)

# The second chair is brown and sits at the other end of the same long desk.
box('nav_chair Brown chair seat', (1.75, -0.75, 0.66), (0.66, 0.64, 0.10), brown)
box('nav_chair Brown chair back', (1.39, -0.75, 1.06), (0.10, 0.64, 0.84), brown)
for x in (1.49, 2.02):
    for y in (-1.01, -0.49):
        box('Brown chair leg', (x, y, 0.37), (0.07, 0.07, 0.58), wood_dark)

# A small houseplant gives the portfolio its cel-shaded, animated object.
plant_x, plant_y = 2.06, -2.55
cylinder('Toon plant pot', (plant_x, plant_y, 0.43), 0.30, 0.48, rose)
cylinder('Toon plant soil', (plant_x, plant_y, 0.68), 0.28, 0.04, wood_dark)
rod('Toon plant stem center', (plant_x, plant_y, 0.70),
    (plant_x, plant_y, 1.51), 0.045, green_dark)
for i in range(7):
    angle = i * math.tau / 7
    height = 1.04 + (i % 3) * 0.15
    leaf_x = plant_x + 0.43 * math.cos(angle)
    leaf_y = plant_y + 0.43 * math.sin(angle)
    rod(f'Toon plant stem {i + 1}', (plant_x, plant_y, 0.82 + (i % 3) * 0.10),
        (leaf_x, leaf_y, height), 0.025, green_dark)
    leaf = sphere(f'Toon plant leaf {i + 1}', (leaf_x, leaf_y, height),
                  (0.36, 0.17, 0.10), green)
    leaf.rotation_euler[1] = math.radians(25 + (i % 3) * 15)
    leaf.rotation_euler[2] = angle
leaf = sphere('Toon plant leaf top', (plant_x, plant_y, 1.55),
              (0.24, 0.17, 0.15), green)

# A soft overhead light is used only for the Blender preview.
world = bpy.context.scene.world
world.color = (0.78, 0.78, 0.78)
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.92, 0.89, 0.85, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
bpy.ops.object.light_add(type='AREA', location=(1, -2, 7))
bpy.context.object.name = 'Preview area light'
bpy.context.object.data.energy = 950
bpy.context.object.data.shape = 'DISK'
bpy.context.object.data.size = 7
bpy.ops.object.camera_add(location=(-10, -12, 9))
camera = bpy.context.object
camera.name = 'Preview camera'
direction = Vector((0, 0, 1.55)) - camera.location
camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 12.8
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 1100
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(OUT / 'portfolio_room_preview.png')
scene.view_settings.view_transform = 'AgX'

# Original ceiling fan above the bed, with a separate rotor pivot.
import runpy
runpy.run_path(str(OUT / 'fan-model.py'))['build_fan']()

# Apply bevels before GLB export and keep names for future picking in the site.
for obj in list(bpy.data.objects):
    if obj.type != 'MESH':
        continue
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)

runpy.run_path(str(OUT / 'animate-room.py'))['animate_room']()

bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'portfolio_room.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT / 'portfolio_room.glb'), export_format='GLB', export_cameras=False, export_lights=False, export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True)
bpy.ops.render.render(write_still=True)

# Measure every mesh corner in world coordinates. Lights and the camera are excluded.
points = [obj.matrix_world @ Vector(corner) for obj in bpy.data.objects if obj.type == 'MESH' for corner in obj.bound_box]
minimum = tuple(round(min(p[i] for p in points), 3) for i in range(3))
maximum = tuple(round(max(p[i] for p in points), 3) for i in range(3))
size = tuple(round(maximum[i] - minimum[i], 3) for i in range(3))
report = f'min={minimum}\nmax={maximum}\nsize={size}\nmesh_count={sum(o.type == "MESH" for o in bpy.data.objects)}\n'
(OUT / 'portfolio_room_bounds.txt').write_text(report)
print(report)
