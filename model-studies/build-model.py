"""Run with Blender --background --python build-model.py."""
import bpy, json, base64
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'source-fox.glb'))
positions=[]; uv=[]
image=next(i for i in bpy.data.images if i.type=='IMAGE' and i.size[0]>0)
w,h=image.size; tex=list(image.pixels[:]); image.filepath_raw=str(ROOT/'fox-texture.png');image.file_format='PNG';image.save()
for obj in list(bpy.context.scene.objects):
 if obj.type!='MESH':continue
 mesh=obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
 mesh.calc_loop_triangles()
 for tri in mesh.loop_triangles:
  for li in tri.loops:
   v=obj.matrix_world @ mesh.vertices[mesh.loops[li].vertex_index].co
   positions.append([v.x,v.z,-v.y]);uv.append(list(mesh.uv_layers.active.data[li].uv))
lo=[min(v[i] for v in positions) for i in range(3)];hi=[max(v[i] for v in positions) for i in range(3)]
size=max(hi[i]-lo[i] for i in range(3));center=[(lo[i]+hi[i])/2 for i in range(3)]
positions=[[(v[i]-center[i])*3/size for i in range(3)] for v in positions]
# Paint a separate palette directly into the mesh's color attribute. This does
# not sample the original orange texture, which belongs to the UV exercise.
def linear_color(hex_color):
 rgb=[int(hex_color[i:i+2],16)/255 for i in (0,2,4)]
 return [c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4 for c in rgb]
colors=[]
for x,y,z in positions:
 color='169DDB'  # blue body
 if z < -0.75: color='9855E8'  # purple tail
 elif y < -0.58: color='23305C'  # dark paws
 elif z > 0.72: color='68D9F0'  # cyan head
 elif y < -0.18: color='326BB5'  # blue legs and underside
 colors.append(linear_color(color))
lines=['# Low poly fox: PixelMannen; rigging tomkranis; conversion AsoboStudio/scurest.']
for v in positions:lines.append('v '+' '.join(f'{x:.6f}' for x in v))
for v in uv:lines.append('vt '+' '.join(f'{x:.6f}' for x in v))
for i in range(0,len(positions),3):lines.append('f '+' '.join(f'{j+1}/{j+1}' for j in range(i,i+3)))
obj_text='\n'.join(lines)+'\n';(ROOT/'fox.obj').write_text(obj_text)
bpy.ops.wm.read_factory_settings(use_empty=True)
mesh=bpy.data.meshes.new('Fox vertex-painted mesh')
mesh.from_pydata([(v[0],-v[2],v[1]) for v in positions],[],[tuple(range(i,i+3)) for i in range(0,len(positions),3)])
obj=bpy.data.objects.new('Fox vertex color',mesh);bpy.context.collection.objects.link(obj)
layer=mesh.color_attributes.new(name='FoxColor',type='FLOAT_COLOR',domain='CORNER')
uv_layer=mesh.uv_layers.new(name='UVMap')
for i in range(len(positions)):
 layer.data[i].color=(*colors[i],1);uv_layer.data[i].uv=uv[i]
mat=bpy.data.materials.new('Vertex Color');mat.use_nodes=True
attribute=mat.node_tree.nodes.new('ShaderNodeVertexColor');attribute.layer_name='FoxColor'
mat.node_tree.links.new(attribute.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
obj.data.materials.append(mat)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  area.spaces.active.shading.type='MATERIAL';area.spaces.active.region_3d.view_distance=5
bpy.ops.object.camera_add(location=(4,-6,3))
camera=bpy.context.object
camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=camera
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.color_type='VERTEX'
scene.display.shading.light='STUDIO'
scene.render.resolution_x=900;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.render.filepath=str(ROOT/'fox-vertex-color-preview.png')
bpy.context.view_layer.objects.active=obj
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'fox-vertex-color.blend'))
bpy.ops.wm.ply_export(filepath=str(ROOT/'fox-vertex-color.ply'))
flat=lambda a:[round(x,6) for row in a for x in row]
data={'positions':flat(positions),'uvs':flat(uv),'colors':flat(colors),'obj':obj_text,'texture':'data:image/png;base64,'+base64.b64encode((ROOT/'fox-texture.png').read_bytes()).decode()}
(ROOT/'model-data.js').write_text('globalThis.foxStudyData = '+json.dumps(data,separators=(',',':'))+';\n')
print('Exported',len(positions)//3,'triangles, vertex colors, OBJ, UV, texture and Blender file')

bpy.ops.render.render(write_still=True)
