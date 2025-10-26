<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ElderScape | RuneScape 3D Viewer</title>

  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:-apple-system,system-ui,sans-serif;background:#0a0a0a;color:#d9d9d9}
    #loading{position:fixed;inset:0;background:#0a0a0a;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;transition:opacity .3s}
    #loading.hide{opacity:0;pointer-events:none}
    .logo{width:100px;margin-bottom:1rem}
    .spinner{width:32px;height:32px;position:relative}
    .spinner div{position:absolute;width:100%;height:100%;border:3px solid #92979b;border-radius:50%;border-color:#92979b transparent transparent transparent;animation:s 2.5s cubic-bezier(.5,0,.5,1) infinite}
    .spinner div:nth-child(1){animation-delay:-.45s}
    .spinner div:nth-child(2){animation-delay:-.3s}
    .spinner div:nth-child(3){animation-delay:-.15s}
    @keyframes s{to{transform:rotate(360deg)}}
    #app{padding:2rem;text-align:center;max-width:800px;margin:auto}
    canvas{width:100%;max-width:512px;border:1px solid #444;border-radius:8px;background:#111}
    button{background:#F78100;color:#fff;border:none;padding:12px 24px;font-size:1rem;border-radius:6px;cursor:pointer;margin:1rem}
    button:hover{background:#e06a00}
    .status{margin:1rem 0;font-size:.9rem;line-height:1.5}
  </style>
</head>
<body>

<div id="loading">
  <svg class="logo" viewBox="0 0 1230.574 519.774" fill="#F78100">
    <path d="M784.025,512.011l5.872