"""Original one-eyed service robot, modeled from primitives in Blender.
Run: blender --background --python build-robot.py
No imported models or textures are used.
"""
import bpy, math, base64, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name,color,metal,rough,emission=False):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=2
 return m
shell=material('Main',(0.025,.24,.42),.8,.24)
silver=material('Brushed steel',(.5,.56,.62),.95,.3)
copper=material('Copper trim',(.65,.22,.055),.85,.25)
rubber=material('Rubber',(.012,.018,.026),0,.82)
visor=material('Dark glass',(.008,.025,.045),.25,.13)
glow=material('Cyan lens',(.05,.8,1),.05,.18,True)
def finish(obj,name,mat):
 obj.name=name;obj.data.materials.append(mat)
 for p in obj.data.polygons:p.use_smooth=True
 return obj
def box(name,loc,size,mat,bevel=.06):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=4
  bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,mat)
def sphere(name,loc,scale,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=1,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,mat)
def cylinder(name,a,b,r,mat):
 a,b=Vector(a),Vector(b);direction=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=direction.length,location=(a+b)/2)
 o=bpy.context.object;o.rotation_euler=direction.to_track_quat('Z','Y').to_euler()
 mod=o.modifiers.new('Edge bevel','BEVEL');mod.width=.025;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,mat)
# Distinct rounded rectangular helmet with a single optical lens and antenna.
box('Helmet shell',(0,0,2.35),(1.32,.9,.86),shell,.19)
box('Visor copper surround',(0,-.455,2.36),(1.13,.09,.53),copper,.12)
box('Visor glass',(0,-.515,2.36),(.99,.06,.4),visor,.1)
cylinder('Lens steel rim',(0,-.54,2.36),(0,-.60,2.36),.19,silver)
cylinder('Single cyan eye',(0,-.605,2.36),(0,-.63,2.36),.135,glow)
for x in [-.42,.42]:
 for z in [2.22,2.5]:sphere('Visor rivet',(x,-.57,z),(.025,.015,.025),silver)
cylinder('Antenna stem',(.4,0,2.76),(.46,0,3.04),.025,copper)
sphere('Antenna light',(.46,0,3.07),(.06,.06,.06),glow)
cylinder('Neck',(0,0,1.84),(0,0,1.97),.16,silver)
box('Torso shell',(0,.02,1.43),(.93,.69,.79),shell,.13)
box('Chest copper plate',(0,-.345,1.5),(.59,.075,.3),copper,.045)
for i in range(3):box('Chest vent '+str(i),(-.18+i*.18,-.39,1.5),(.075,.025,.18),rubber,.012)
box('Back battery',(0,.46,1.47),(.61,.26,.52),silver,.065)
cylinder('Waist coupling',(0,0,.91),(0,0,1.06),.22,rubber)
box('Hip assembly',(0,0,.89),(.76,.55,.22),silver,.045)
for side in [-1,1]:
 x=side*.64
 sphere('Shoulder bearing',(side*.55,0,1.7),(.16,.16,.16),silver)
 elbow=(side*.79,-.02,1.23);wrist=(side*.73,-.22,.98)
 cylinder('Upper arm',(side*.6,0,1.62),elbow,.11,shell)
 sphere('Elbow',elbow,(.13,.13,.13),rubber)
 cylinder('Forearm',elbow,wrist,.115,silver)
 box('Palm',wrist,(.23,.21,.21),shell,.045)
 for finger in [-1,1]:
  a=(wrist[0]+finger*.105,wrist[1]-.08,wrist[2]-.07)
  b=(wrist[0]+finger*.105,wrist[1]-.17,wrist[2]-.23)
  cylinder('Gripper finger',a,b,.045,copper)
  cylinder('Gripper tip',b,(b[0]-finger*.055,b[1]-.025,b[2]),.04,rubber)
 leg_x=side*.25
 cylinder('Thigh',(leg_x,0,.82),(leg_x,0,.56),.13,shell)
 sphere('Knee bearing',(leg_x,0,.52),(.14,.14,.14),silver)
 cylinder('Shin',(leg_x,0,.45),(leg_x,0,.2),.12,shell)
 box('Boot sole',(leg_x,-.16,.065),(.38,.58,.12),rubber,.04)
 box('Boot armor',(leg_x,-.16,.16),(.34,.5,.15),copper,.05)
# Blender source with a camera and real studio lights for a usable PBR render.
bpy.ops.object.camera_add(location=(5,-8,4.2));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.5))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=55;bpy.context.scene.camera=camera
for loc,power,size in [((-3,-4,6),1100,5),((4,-2,3),900,3),((1,4,5),1400,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,1.4))-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.world=bpy.data.worlds.new('Studio World');scene.world.color=(.18,.18,.18);scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.filepath=str(ROOT/'original-robot-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'original-robot.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'robot-pbr.glb'),export_format='GLB',export_cameras=False,export_lights=False)
(ROOT/'model-data.js').write_text('globalThis.pbrRobotBase64 = '+json.dumps(base64.b64encode((ROOT/'robot-pbr.glb').read_bytes()).decode())+';\n')
bpy.ops.render.render(write_still=True)
