import * as THREE from 'three';
import { mathToThree, mathVecToThree, type Vec3 } from '../math/coords';
import { vecDot, vecNorm, vecScale } from '../math/vectors';

export function makeTextSprite(
  text: string,
  color: string,
  bgColor?: string,
  scale = 0.65,
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 44;
  ctx.font = `700 ${fontSize}px Inter, "IBM Plex Sans Thai", "Sarabun", sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const isHalo = !bgColor || bgColor === 'halo' || bgColor === 'halo-dark';
  const padX = isHalo ? 14 : 22;
  const padY = isHalo ? 10 : 14;
  canvas.width = Math.max(64, Math.ceil(textWidth + padX * 2));
  canvas.height = Math.ceil(fontSize + padY * 2);

  ctx.font = `700 ${fontSize}px Inter, "IBM Plex Sans Thai", "Sarabun", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (bgColor && !isHalo) {
    ctx.fillStyle = bgColor;
    const r = 14;
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
  }

  if (isHalo) {
    ctx.strokeStyle =
      bgColor === 'halo-dark' ? 'rgba(15,23,42,0.92)' : 'rgba(248,250,252,0.95)';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + 2);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(scale * aspect, scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}

export function addPolyline(
  group: THREE.Group,
  pts: Vec3[],
  color: number | string,
  opacity = 1,
  dashed = false,
) {
  if (pts.length < 2) return;
  const threePts = pts.map((p) => mathVecToThree(p));
  const geom = new THREE.BufferGeometry().setFromPoints(threePts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({
        color,
        dashSize: 0.22,
        gapSize: 0.14,
        transparent: opacity < 1,
        opacity,
      })
    : new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      });
  const line = new THREE.Line(geom, mat);
  if (dashed) line.computeLineDistances();
  group.add(line);
}

export function addThickCurve(
  group: THREE.Group,
  pts: Vec3[],
  color: number | string,
  radius = 0.055,
) {
  if (pts.length < 2) return;
  const threePts = pts.map((p) => mathVecToThree(p));
  const curve =
    threePts.length === 2
      ? new THREE.LineCurve3(threePts[0], threePts[1])
      : new THREE.CatmullRomCurve3(threePts, false, 'centripetal', 0.05);
  const segs = threePts.length === 2 ? 2 : Math.min(140, threePts.length * 2);
  const geom = new THREE.TubeGeometry(curve, segs, radius, 8, false);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.renderOrder = 10;
  group.add(mesh);
}

export function addLabeledSphere(
  group: THREE.Group,
  pt: Vec3,
  color: string,
  label?: string,
  darkMode = false,
  radius = 0.13,
  labelOffsetY = 0.36,
) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 20),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 }),
  );
  const pos3 = mathVecToThree(pt);
  sphere.position.copy(pos3);
  sphere.renderOrder = 12;
  group.add(sphere);

  if (label) {
    const sp = makeTextSprite(
      label,
      color,
      darkMode ? 'halo-dark' : 'halo',
      0.5,
    );
    sp.position.copy(pos3).add(new THREE.Vector3(0, labelOffsetY, 0));
    group.add(sp);
  }
}

export interface ArrowOptions {
  shaftRadius?: number;
  headRadius?: number;
  headLen?: number;
  opacity?: number;
  labelMidpoint?: boolean;
  labelScale?: number;
}

export function addSolidVectorArrow(
  group: THREE.Group,
  origin: Vec3,
  vec: Vec3,
  color: string,
  label?: string,
  darkMode = false,
  opts: ArrowOptions = {},
) {
  const o3 = mathVecToThree(origin);
  const endMath: Vec3 = [origin[0] + vec[0], origin[1] + vec[1], origin[2] + vec[2]];
  const e3 = mathVecToThree(endMath);
  const dir3 = e3.clone().sub(o3);
  const len = dir3.length();

  if (len < 1e-4) {
    addLabeledSphere(group, origin, color, label, darkMode, 0.1, 0.34);
    return;
  }

  const uDir = dir3.clone().divideScalar(len);
  const headLen = Math.min(opts.headLen ?? 0.34, len * 0.42);
  const headRadius = Math.min(opts.headRadius ?? 0.13, headLen * 0.48);
  const shaftRadius = opts.shaftRadius ?? 0.048;
  const shaftLen = Math.max(0.01, len - headLen);
  const opacity = opts.opacity ?? 1;

  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), uDir);

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.1,
    transparent: opacity < 1,
    opacity,
  });

  const shaftGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 14);
  const shaft = new THREE.Mesh(shaftGeom, mat);
  shaft.quaternion.copy(quat);
  shaft.position.copy(o3).addScaledVector(uDir, shaftLen / 2);
  shaft.renderOrder = 8;
  group.add(shaft);

  const headGeom = new THREE.ConeGeometry(headRadius, headLen, 16);
  const head = new THREE.Mesh(headGeom, mat.clone());
  head.quaternion.copy(quat);
  head.position.copy(o3).addScaledVector(uDir, shaftLen + headLen / 2);
  head.renderOrder = 9;
  group.add(head);

  if (label) {
    const sp = makeTextSprite(
      label,
      color,
      darkMode ? 'halo-dark' : 'halo',
      opts.labelScale ?? 0.52,
    );
    if (opts.labelMidpoint === false) {
      sp.position.copy(e3).addScaledVector(uDir, 0.34);
    } else {
      const ref =
        Math.abs(uDir.y) < 0.88 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const side = new THREE.Vector3().crossVectors(uDir, ref);
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      side.normalize();
      const orthoUp = new THREE.Vector3().crossVectors(side, uDir).normalize();
      const offsetDist = Math.min(0.36, Math.max(0.24, len * 0.16));
      sp.position
        .copy(o3)
        .addScaledVector(uDir, len * 0.52)
        .addScaledVector(orthoUp, offsetDist)
        .addScaledVector(side, 0.14);
    }
    group.add(sp);
  }
}

export function addCoordinateBox(
  group: THREE.Group,
  pt: Vec3,
  color: string,
  opacity = 0.55,
) {
  const [x, y, z] = pt;
  const edges: Array<[Vec3, Vec3]> = [
    [[x, 0, 0], [x, y, 0]],
    [[0, y, 0], [x, y, 0]],
    [[x, y, 0], [x, y, z]],
    [[0, 0, z], [x, 0, z]],
    [[0, 0, z], [0, y, z]],
    [[x, 0, 0], [x, 0, z]],
    [[0, y, 0], [0, y, z]],
    [[x, 0, z], [x, y, z]],
    [[0, y, z], [x, y, z]],
  ];
  for (const [a, b] of edges) {
    if (Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) > 1e-4) {
      addPolyline(group, [a, b], color, opacity, true);
    }
  }
}

export function addAngleSector(
  group: THREE.Group,
  origin: Vec3,
  v1: Vec3,
  v2: Vec3,
  radius: number,
  color: string,
  label?: string,
  darkMode = false,
) {
  const n1 = vecNorm(v1);
  const n2 = vecNorm(v2);
  if (n1 < 1e-4 || n2 < 1e-4) return;

  const a3 = mathVecToThree(v1).normalize();
  const b3 = mathVecToThree(v2).normalize();
  const dot = Math.max(-1, Math.min(1, a3.dot(b3)));
  const angle = Math.acos(dot);
  if (angle < 0.02) return;

  let bPerp = b3.clone().addScaledVector(a3, -dot);
  if (bPerp.length() < 1e-4) {
    const ref = Math.abs(a3.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    bPerp = new THREE.Vector3().crossVectors(a3, ref).normalize();
  } else {
    bPerp.normalize();
  }

  const r = Math.min(radius, n1 * 0.72, n2 * 0.72);
  if (r < 0.18) return;

  const o3 = mathVecToThree(origin);
  const segs = 28;
  const arcPts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = (angle * i) / segs;
    const p = o3
      .clone()
      .addScaledVector(a3, r * Math.cos(t))
      .addScaledVector(bPerp, r * Math.sin(t));
    arcPts.push(p);
  }

  // Translucent wedge
  const positions: number[] = [];
  for (let i = 0; i < segs; i++) {
    positions.push(
      o3.x, o3.y, o3.z,
      arcPts[i].x, arcPts[i].y, arcPts[i].z,
      arcPts[i + 1].x, arcPts[i + 1].y, arcPts[i + 1].z,
    );
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));

  // Border arc
  const arcGeom = new THREE.BufferGeometry().setFromPoints(arcPts);
  group.add(new THREE.Line(arcGeom, new THREE.LineBasicMaterial({ color })));

  if (label) {
    const midAngle = angle / 2;
    const labelPos = o3
      .clone()
      .addScaledVector(a3, r * 1.32 * Math.cos(midAngle))
      .addScaledVector(bPerp, r * 1.32 * Math.sin(midAngle));
    const sp = makeTextSprite(
      label,
      color,
      darkMode ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.9)',
      0.46,
    );
    sp.position.copy(labelPos);
    group.add(sp);
  }
}

export function addRightAngleMarker(
  group: THREE.Group,
  corner: Vec3,
  d1: Vec3,
  d2: Vec3,
  size: number,
  color: string,
) {
  const n1 = vecNorm(d1);
  const n2 = vecNorm(d2);
  if (n1 < 1e-4 || n2 < 1e-4) return;
  const u1 = vecScale(d1, 1 / n1);
  const u2 = vecScale(d2, 1 / n2);
  if (Math.abs(vecDot(u1, u2)) > 0.08) return;

  const s = Math.min(size, n1 * 0.4, n2 * 0.4);
  if (s < 0.08) return;

  const p1: Vec3 = [corner[0] + s * u1[0], corner[1] + s * u1[1], corner[2] + s * u1[2]];
  const p2: Vec3 = [p1[0] + s * u2[0], p1[1] + s * u2[1], p1[2] + s * u2[2]];
  const p3: Vec3 = [corner[0] + s * u2[0], corner[1] + s * u2[1], corner[2] + s * u2[2]];
  addPolyline(group, [p1, p2, p3], color, 0.9);
}

export function addParallelogram(
  group: THREE.Group,
  origin: Vec3,
  u: Vec3,
  v: Vec3,
  color: string,
  opacity = 0.24,
) {
  const p0 = origin;
  const p1: Vec3 = [origin[0] + u[0], origin[1] + u[1], origin[2] + u[2]];
  const p2: Vec3 = [p1[0] + v[0], p1[1] + v[1], p1[2] + v[2]];
  const p3: Vec3 = [origin[0] + v[0], origin[1] + v[1], origin[2] + v[2]];

  const t0 = mathVecToThree(p0);
  const t1 = mathVecToThree(p1);
  const t2 = mathVecToThree(p2);
  const t3 = mathVecToThree(p3);

  const geom = new THREE.BufferGeometry().setFromPoints([t0, t1, t2, t0, t2, t3]);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));
  addPolyline(group, [p1, p2, p3], color, 0.7, true);
}

export function addTriangle(
  group: THREE.Group,
  origin: Vec3,
  u: Vec3,
  v: Vec3,
  color: string,
  opacity = 0.34,
) {
  const p1: Vec3 = [origin[0] + u[0], origin[1] + u[1], origin[2] + u[2]];
  const p2: Vec3 = [origin[0] + v[0], origin[1] + v[1], origin[2] + v[2]];

  const t0 = mathVecToThree(origin);
  const t1 = mathVecToThree(p1);
  const t2 = mathVecToThree(p2);

  const geom = new THREE.BufferGeometry().setFromPoints([t0, t1, t2]);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));
  addPolyline(group, [p1, p2], color, 0.85, false);
}

export function addParallelepiped(
  group: THREE.Group,
  u: Vec3,
  v: Vec3,
  w: Vec3,
  color: string,
) {
  const add2 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const o: Vec3 = [0, 0, 0];
  const uv = add2(u, v);
  const uw = add2(u, w);
  const vw = add2(v, w);
  const uvw = add2(uv, w);

  const faces: Array<[Vec3, Vec3, Vec3, Vec3]> = [
    [o, u, uv, v],
    [w, uw, uvw, vw],
    [o, u, uw, w],
    [v, uv, uvw, vw],
    [o, v, vw, w],
    [u, uv, uvw, uw],
  ];

  const pts: THREE.Vector3[] = [];
  for (const [a, b, c, d] of faces) {
    const ta = mathVecToThree(a);
    const tb = mathVecToThree(b);
    const tc = mathVecToThree(c);
    const td = mathVecToThree(d);
    pts.push(ta, tb, tc, ta, tc, td);
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));

  const edges: Array<[Vec3, Vec3]> = [
    [u, uv],
    [v, uv],
    [u, uw],
    [w, uw],
    [v, vw],
    [w, vw],
    [uv, uvw],
    [uw, uvw],
    [vw, uvw],
  ];
  for (const [a, b] of edges) {
    addPolyline(group, [a, b], color, 0.72, true);
  }
}

export function addAxesSet(
  group: THREE.Group,
  origin: Vec3,
  posLen: number,
  negLen: number,
  isShifted: boolean,
  darkMode: boolean,
) {
  const ox = origin[0];
  const oy = origin[1];
  const oz = origin[2];
  const oThree = mathToThree(ox, oy, oz);

  const axisDefs: Array<{
    dirMath: Vec3;
    label: string;
    color: string;
    negColor: string;
  }> = isShifted
    ? [
        { dirMath: [1, 0, 0], label: "x'", color: '#f97316', negColor: '#fb923c' },
        { dirMath: [0, 1, 0], label: "y'", color: '#f97316', negColor: '#fb923c' },
        { dirMath: [0, 0, 1], label: "z'", color: '#f97316', negColor: '#fb923c' },
      ]
    : [
        { dirMath: [1, 0, 0], label: 'x', color: '#ef4444', negColor: darkMode ? '#7f1d1d' : '#fca5a5' },
        { dirMath: [0, 1, 0], label: 'y', color: '#10b981', negColor: darkMode ? '#064e3b' : '#6ee7b7' },
        { dirMath: [0, 0, 1], label: 'z', color: '#3b82f6', negColor: darkMode ? '#1e3a8a' : '#93c5fd' },
      ];

  for (const ax of axisDefs) {
    const dirThree = mathVecToThree(ax.dirMath).normalize();
    const arrow = new THREE.ArrowHelper(
      dirThree,
      oThree,
      posLen,
      ax.color,
      0.34,
      0.16,
    );
    group.add(arrow);

    if (negLen > 0) {
      const pNeg: Vec3 = [
        ox - ax.dirMath[0] * negLen,
        oy - ax.dirMath[1] * negLen,
        oz - ax.dirMath[2] * negLen,
      ];
      addPolyline(group, [origin, pNeg], ax.negColor, isShifted ? 0.55 : 0.7, true);
    }

    const labelPos = oThree.clone().addScaledVector(dirThree, posLen + 0.35);
    const sprite = makeTextSprite(
      ax.label,
      ax.color,
      darkMode ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.85)',
      isShifted ? 0.55 : 0.62,
    );
    sprite.position.copy(labelPos);
    group.add(sprite);

    if (!isShifted) {
      const tickColor = darkMode ? 0x64748b : 0x94a3b8;
      const perp: Vec3 =
        ax.dirMath[2] === 1 ? [0.08, 0, 0] : [0, 0, 0.08];
      for (let t = -4; t <= 4; t++) {
        if (t === 0) continue;
        const base: Vec3 = [
          ox + ax.dirMath[0] * t,
          oy + ax.dirMath[1] * t,
          oz + ax.dirMath[2] * t,
        ];
        addPolyline(
          group,
          [
            [base[0] - perp[0], base[1] - perp[1], base[2] - perp[2]],
            [base[0] + perp[0], base[1] + perp[1], base[2] + perp[2]],
          ],
          tickColor,
          0.85,
        );
      }
    }
  }
}

export function addQuadPatch(
  group: THREE.Group,
  cornersMath: [Vec3, Vec3, Vec3, Vec3],
  color: string | number,
  opacity = 0.18,
  borderOpacity = 0.65,
  dashedBorder = false,
) {
  const cThree = cornersMath.map((c) => mathVecToThree(c));
  const geom = new THREE.BufferGeometry().setFromPoints([
    cThree[0],
    cThree[1],
    cThree[2],
    cThree[0],
    cThree[2],
    cThree[3],
  ]);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));
  addPolyline(
    group,
    [cornersMath[0], cornersMath[1], cornersMath[2], cornersMath[3], cornersMath[0]],
    color,
    borderOpacity,
    dashedBorder,
  );
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) m?.dispose();
    } else if (obj instanceof THREE.Sprite) {
      obj.material.map?.dispose();
      obj.material.dispose();
    }
  });
}
