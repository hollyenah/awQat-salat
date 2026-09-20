// qr.js — Générateur QR minimal (byte mode, ECC L, versions 1-5)
// Expose window.QR.toSVG(texte, scale) → chaîne SVG
window.QR = (function () {
  'use strict';

  // ---- GF(256) ----
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x = (x << 1) ^ ((x & 0x80) ? 0x11D : 0);
    }
    for (var i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gfMul(a, b) { return (a && b) ? EXP[LOG[a] + LOG[b]] : 0; }

  // Versions (ECC L, 1 bloc) : [totalCW, dataCW, eccCW, taille, align]
  var V = {
    1: [26, 19, 7, 21, []],
    2: [44, 34, 10, 25, [6, 18]],
    3: [70, 55, 15, 29, [6, 22]],
    4: [100, 80, 20, 33, [6, 26]],
    5: [134, 108, 26, 37, [6, 30]]
  };

  // Format info (ECC L, masque 0..7)
  function fmtFor(mask) {
    var data = (0x01 << 3) | mask;   // L = 01
    var d = data << 10;
    for (var i = 14; i >= 10; i--)
      if (d & (1 << i)) d ^= 0x537 << (i - 10);
    return ((data << 10) | d) ^ 0x5412;
  }

  // Reed–Solomon
  function rs(data, eccLen) {
    var gen = [1];
    for (var i = 0; i < eccLen; i++) {
      var next = new Array(gen.length + 1);
      for (var k = 0; k < next.length; k++) next[k] = 0;
      for (var j = 0; j < gen.length; j++) {
        next[j]     ^= gen[j];
        next[j + 1] ^= gfMul(gen[j], EXP[i]);
      }
      gen = next;
    }
    var res = data.slice();
    for (var i = 0; i < eccLen; i++) res.push(0);
    for (var i = 0; i < data.length; i++) {
      var c = res[i];
      if (!c) continue;
      for (var j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], c);
    }
    return res.slice(data.length);
  }

  function encode(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i) & 0xFF);

    var ver = 0;
    for (var v = 1; v <= 5; v++) {
      if (4 + 8 + 8 * bytes.length <= V[v][1] * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('QR: données trop longues');

    var info = V[ver];
    var dataCW = info[1], eccCW = info[2], size = info[3], align = info[4];

    // Bit stream
    var bits = [];
    function put(v, len) { for (var i = len - 1; i >= 0; i--) bits.push((v >> i) & 1); }
    put(4, 4);
    put(bytes.length, 8);
    for (var i = 0; i < bytes.length; i++) put(bytes[i], 8);
    var maxBits = dataCW * 8;
    for (var i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);

    var dataBytes = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] || 0);
      dataBytes.push(b);
    }
    var pads = [0xEC, 0x11], pi = 0;
    while (dataBytes.length < dataCW) dataBytes.push(pads[pi++ % 2]);

    var ecc = rs(dataBytes, eccCW);
    var cw = dataBytes.concat(ecc);

    // Matrice
    var M = [], R = [];
    for (var i = 0; i < size; i++) {
      M.push(new Array(size).fill(false));
      R.push(new Array(size).fill(false));
    }
    function setF(i, j, v) { M[i][j] = v; R[i][j] = true; }

    function finder(r, c) {
      for (var i = -1; i <= 7; i++) for (var j = -1; j <= 7; j++) {
        var rr = r + i, cc = c + j;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        var v;
        if (i === -1 || i === 7 || j === -1 || j === 7) v = false;
        else if (i === 0 || i === 6 || j === 0 || j === 6) v = true;
        else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) v = true;
        else v = false;
        setF(rr, cc, v);
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    for (var i = 8; i < size - 8; i++) {
      setF(6, i, i % 2 === 0);
      setF(i, 6, i % 2 === 0);
    }

    for (var a = 0; a < align.length; a++) for (var b = 0; b < align.length; b++) {
      var r = align[a], c = align[b];
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) {
        var d = Math.max(Math.abs(i), Math.abs(j));
        setF(r + i, c + j, d !== 1);
      }
    }

    setF(size - 8, 8, true);

    var fmtPos = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
      [size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],
      [8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]
    ];
    for (var i = 0; i < fmtPos.length; i++) {
      var p = fmtPos[i];
      if (!R[p[0]][p[1]]) { M[p[0]][p[1]] = false; R[p[0]][p[1]] = true; }
    }

    var bitIdx = 0;
    function nextBit() {
      var b = (cw[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
      bitIdx++;
      return b;
    }
    var row = size - 1, col = size - 1, dir = -1;
    while (col > 0) {
      if (col === 6) col--;
      for (var k = 0; k < 2; k++) {
        var c = col - k;
        if (!R[row][c]) {
          var bit = nextBit();
          var m = ((row + c) % 2 === 0) ? 1 : 0;
          M[row][c] = (bit ^ m) === 1;
        }
      }
      row += dir;
      if (row < 0 || row >= size) {
        row -= dir;
        dir = -dir;
        col -= 2;
      }
    }

    var fbits = fmtFor(0);
    var fmt1 = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
    ];
    var fmt2 = [
      [size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],
      [8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]
    ];
    for (var i = 0; i < 15; i++) {
      var bit = (fbits >> (14 - i)) & 1;
      M[fmt1[i][0]][fmt1[i][1]] = bit === 1;
      M[fmt2[i][0]][fmt2[i][1]] = bit === 1;
    }

    return M;
  }

function toSVG(text, scale, opts) {
  scale = scale || 4;
  opts  = opts  || {};
  var dark  = opts.dark  || '#000000';
  var light = opts.light || '#ffffff';

  var M = encode(text);
  var n = M.length, q = 4, total = n + 2 * q, px = total * scale;
  var d = '';
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      if (M[i][j]) d += 'M' + (j + q) + ' ' + (i + q) + 'h1v1h-1z';
    }
  }

  // Fond du QR : seulement si light n'est pas transparent
  var bg = (light === 'transparent' || light === 'none')
    ? ''
    : '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>';

  // Modules sombres : seulement si dark n'est pas transparent
  var fg = (dark === 'transparent' || dark === 'none' || !d)
    ? ''
    : '<path d="' + d + '" fill="' + dark + '"/>';

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px +
    '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
    bg + fg + '</svg>';
}

  return { toSVG: toSVG, encode: encode };
})();