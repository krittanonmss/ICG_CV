"""Author looping ceiling-fan animation keyframes; plant motion uses the web vertex shader in Blender."""
import bpy, math
from mathutils import Vector

def animate_room():
 scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=121
 fan=bpy.data.objects['Fan rotor pivot'];fan.animation_data_clear();fan.rotation_mode='XYZ'
 for action in list(bpy.data.actions):
  if action.name.startswith('CeilingFanSpin'):bpy.data.actions.remove(action)
 for frame in range(1,62):
  fan.rotation_euler=(0,0,(frame-1)*math.tau/30)
  fan.keyframe_insert(data_path='rotation_euler',frame=frame)
 fan.animation_data.action.name='CeilingFanSpin'
 plant=bpy.data.objects.get('Plant sway pivot')
 if plant:
  plant.animation_data_clear();plant.rotation_euler=(0,0,0)
 for obj in [fan]:
  action=obj.animation_data.action
  curves=action.layers[0].strips[0].channelbag(obj.animation_data.action_slot).fcurves
  for curve in curves:
   for key in curve.keyframe_points:key.interpolation='LINEAR'
   curve.modifiers.new('CYCLES')
 scene.frame_set(1)
 return fan
