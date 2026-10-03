"""Run with Blender --background --python build-helmet.py."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'source-helmet.glb'))
positions=[];normals=[]
for obj in bpy.context.scene.objects:
 if obj.type!='MESH':continue
 mesh=obj.data;mesh.calc_loop_triangles()
 normal_matrix=obj.matrix_world.to_3x3().inverted().transposed()
 for tri in mesh.loop_triangles:
  for li in tri.loops:
   vertex=mesh.vertices[mesh.loops[li].vertex_index]
   p=obj.matrix_world@vertex.co;n=(normal_matrix@vertex.normal).normalized()
   positions.append([p.x,p.z,-p.y]);normals.append([n.x,n.z,-n.y])
lo=[min(p[i] for p in positions) for i in range(3)];hi=[max(p[i] for p in positions) for i in range(3)]
center=[(lo[i]+hi[i])/2 for i in range(3)];size=max(hi[i]-lo[i] for i in range(3))
lines=['# Damaged Helmet by theblueturtle_, CC BY-NC 4.0']
for p in positions:lines.append('v '+' '.join(f'{(p[i]-center[i])*3/size:.6f}' for i in range(3)))
for n in normals:lines.append('vn '+' '.join(f'{v:.6f}' for v in n))
for i in range(0,len(positions),3):lines.append('f '+' '.join(f'{j+1}//{j+1}' for j in range(i,i+3)))
s='\n'.join(lines)+'\n';(ROOT/'helmet.obj').write_text(s)
(ROOT/'helmet-data.js').write_text('globalThis.helmetObjData = '+json.dumps(s)+';\n')
print('Helmet:',len(positions)//3,'triangles')
