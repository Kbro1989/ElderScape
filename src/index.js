export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve HTML on root /
    if (path === '/' || path === '') {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ElderScape | RuneScape 3D Viewer</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:-apple-system,system-ui,sans-serif;background:#0a0a0a;color:#d9d9d9}
    #app{padding:2rem;text-align:center;max-width:800px;margin:auto}
    canvas{width:100%;max-width:512px;border:1px solid #444;border-radius:8px;background:#111}
    button{background:#F78100;color:#fff;border:none;padding:12px 24px;font-size:1rem;border-radius:6px;cursor:pointer;margin:1rem}
    button:hover{background:#e06a00}
    .status{margin:1rem 0;font-size:.9rem;line-height:1.5}
  </style>
</head>
<body>
  <div id="app">
    <h1>ElderScape</h1>
    <p>RuneScape 3D Model Viewer + AI Lore</p>
    <button id="load-116">Load Granite Rock (ID 116)</button>
    <button id="load-batch">Batch 10 Models</button>
    <div id="status">Ready</div>
    <canvas id="canvas" width="512" height="512"></canvas>
  </div>

  <script type="module">
    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js';
    import { GLTFExporter } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/exporters/GLTFExporter.js';

    const canvas = document.getElementById('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(512, 512);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    scene.add(new THREE.AmbientLight(0xffffff, 1));

    let currentModelId = null;

    async function loadModel(id) {
      currentModelId = id;
      scene.clear();
      const res = await fetch(\`https://rs3-ai-api.pages.dev/\${id}.json\`);
      if (!res.ok) throw new Error(\`Model \${id} not found\`);
      const d = await res.json();
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(d.vertices.flat(), 3));
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(...d.color.map(c => c / 255)),
        transparent: d.alphamode !== 'opaque'
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      // Auto-center
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      const center = box.getCenter(new THREE.Vector3());
      mesh.position.sub(center);
      mesh.position.y -= (box.max.y - box.min.y) * 0.5;

      renderer.render(scene, camera);
      return d;
    }

    async function exportAsset(type = 'png') {
      let blob;
      if (type === 'gltf') {
        const exp = new GLTFExporter();
        blob = await new Promise(r => exp.parse(scene, gltf => r(new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' })), { binary: false }));
      } else {
        blob = dataURLtoBlob(renderer.domElement.toDataURL('image/png'));
      }
      const form = new FormData();
      form.append('file', blob, \`model_\${currentModelId}.\${type}\`);
      form.append('modelId', currentModelId);
      form.append('type', type);
      const r = await fetch('/api/export', { method: 'POST', body: form });
      return r.json();
    }

    function dataURLtoBlob(url) {
      const [h, b] = url.split(',');
      const bin = atob(b);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: h.match(/:(.*?);/)[1] });
    }

    async function batchExport(ids, types = ['png']) {
      const out = [];
      for (const id of ids) {
        try {
          await loadModel(id);
          for (const t of types) out.push(await exportAsset(t));
        } catch (e) { console.warn(e); }
        scene.clear();
      }
      return out;
    }

    const status = document.getElementById('status');
    document.getElementById('load-116').onclick = async () => {
      status.textContent = 'Loading model...';
      try {
        await loadModel(116);
        status.textContent = 'Generating AI lore...';
        const r = await exportAsset('png');
        status.innerHTML = `<strong>Lore:</strong><br><em>"\${r.lore}"</em>`;
      } catch (e) { status.textContent = 'Error: ' + e.message; }
    };

    document.getElementById('load-batch').onclick = () => {
      status.textContent = 'Batching 10 models...';
      batchExport([116,117,118,119,120,121,122,123,124,125],['png'])
        .then(r => status.textContent = \`Done – \${r.length} lores generated\`)
        .catch(e => status.textContent = 'Batch failed');
    };
  </script>
</body>
</html>
