"""Original minimal three-blade ceiling fan made in Blender."""
import bpy, math
from mathutils import Vector

def build_fan():
 def mat(name,color,metal=0,rough=.5):
  m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
  p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
 housing=mat('Fan warm ivory',(.85,.84,.77))
 blade_mat=mat('Fan walnut blades',(.32,.19,.105),0,.65)
 steel=mat('Fan brushed mount',(.39,.43,.46),.7,.3)
 def finish(o,name,m):
  o.name=name;o.data.materials.append(m)
  for p in o.data.polygons:p.use_smooth=True
  return o
 def cylinder(name,loc,radius,depth,m):
  bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc)
  o=bpy.context.object;mod=o.modifiers.new('Soft rim','BEVEL');mod.width=.025;mod.segments=3
  bpy.ops.object.modifier_apply(modifier=mod.name);return finish(o,name,m)
 # Ceiling height is 3.5, aligned with the top of the room walls.
 x,y,z=-1.54,-.35,3.0
 cylinder('Fan ceiling canopy',(x,y,3.45),.16,.1,housing)
 cylinder('Fan ceiling downrod',(x,y,3.255),.028,.35,steel)
 cylinder('Fan motor housing',(x,y,3.07),.19,.17,housing)
 pivot=bpy.data.objects.new('Fan rotor pivot',None);bpy.context.collection.objects.link(pivot);pivot.location=(x,y,z)
 # Narrow roots sit under the hub; three swept wooden blades stay apart.
 outline=[(.12,-.045),(.32,-.085),(.84,-.12),(.95,-.08),(.98,.01),(.91,.085),(.4,.09),(.12,.045)]
 for i in range(3):
  angle=i*math.tau/3;verts=[]
  for depth in [-.018,.018]:
   for a,b in outline:verts.append((a*math.cos(angle)-b*math.sin(angle),a*math.sin(angle)+b*math.cos(angle),depth))
  n=len(outline);faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
  mesh=bpy.data.meshes.new('Ceiling blade mesh');mesh.from_pydata(verts,[],faces)
  o=bpy.data.objects.new('Fan blade '+str(i+1),mesh);bpy.context.collection.objects.link(o);o.parent=pivot
  bevel=o.modifiers.new('Rounded blade edge','BEVEL');bevel.width=.015;bevel.segments=3
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
  finish(o,o.name,blade_mat)
 hub=cylinder('Fan rotor hub',(0,0,-.035),.2,.10,housing);hub.parent=pivot;hub.location=(0,0,-.035)
 return pivot
