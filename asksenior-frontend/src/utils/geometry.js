import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'

export function sampleGeometry(geometry, count) {
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  const sampler = new MeshSurfaceSampler(mesh).build()

  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)

  const _p = new THREE.Vector3()
  const _n = new THREE.Vector3()

  for (let i = 0; i < count; i++) {
    sampler.sample(_p, _n)
    positions[i * 3] = _p.x
    positions[i * 3 + 1] = _p.y
    positions[i * 3 + 2] = _p.z

    normals[i * 3] = _n.x
    normals[i * 3 + 1] = _n.y
    normals[i * 3 + 2] = _n.z
  }

  geometry.dispose()
  return { positions, normals }
}

export function genSphere(n) {
  const R = 0.38;
  const nodes = [
    { x: -0.6, y: 0.55, z: 0.1 },
    { x: 0.75, y: 0.1, z: -0.3 },
    { x: -0.2, y: -0.7, z: 0.2 }
  ]

  const geometries = [];
  nodes.forEach(node => {
    const g = new THREE.SphereGeometry(R, 32, 32).toNonIndexed();
    g.translate(node.x, node.y, node.z);
    geometries.push(g);
  });

  const connections = [[nodes[0], nodes[1]], [nodes[1], nodes[2]], [nodes[2], nodes[0]]];
  connections.forEach(conn => {
    const [A, B] = conn;
    const dist = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z);
    const g = new THREE.CylinderGeometry(0.035, 0.035, dist, 12).toNonIndexed();
    const axis = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(B.x - A.x, B.y - A.y, B.z - A.z).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
    g.applyQuaternion(quaternion);
    g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    geometries.push(g);
  });

  const merged = BufferGeometryUtils.mergeGeometries(geometries);
  merged.center();
  const SCALE = 1.15;
  merged.scale(SCALE, SCALE, SCALE);

  return sampleGeometry(merged, n);
}

export function genQuestionMark(n) {
  const hookGeo = new THREE.TorusGeometry(0.32, 0.13, 16, 64, Math.PI * 1.5).toNonIndexed();
  hookGeo.rotateZ(-Math.PI * 0.5);
  hookGeo.translate(0, 0.25, 0);

  const stemGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.35, 16).toNonIndexed();
  stemGeo.translate(0, -0.245, 0);

  const dotGeo = new THREE.SphereGeometry(0.14, 16, 16).toNonIndexed();
  dotGeo.translate(0, -0.65, 0);

  const merged = BufferGeometryUtils.mergeGeometries([hookGeo, stemGeo, dotGeo]);
  merged.center();

  const SCALE = 1.25;
  merged.scale(SCALE, SCALE, SCALE * 0.85);

  return sampleGeometry(merged, n);
}

export function genChatIcon(n) {
  const W = 1.25, H = 0.95, R = 0.28;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + R, -H / 2);
  shape.lineTo(-0.15, -H / 2);
  shape.lineTo(-0.50, -0.82);
  shape.lineTo(-0.35, -H / 2);
  shape.lineTo(W / 2 - R, -H / 2);
  shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R);
  shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
  shape.lineTo(-W / 2 + R, H / 2);
  shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
  shape.lineTo(-W / 2, -H / 2 + R);
  shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.06, bevelThickness: 0.06 }).toNonIndexed();
  geo.center();

  const SCALE = 1.25;
  geo.scale(SCALE, SCALE, SCALE * 1.5);

  return sampleGeometry(geo, n);
}
