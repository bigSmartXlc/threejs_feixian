import ThreeMap from './ThreeMap';
import img1 from './assets/images/lightray.jpg';
import img2 from './assets/images/lightray_yellow.jpg';
import throttle from 'lodash.throttle';

const THREE = window.THREE;
export default class ThreeMapLightBar extends ThreeMap {
  constructor(set) {
    super(set);
    this.dataKeys = {};
    this.setDataKeys();
    this.colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
    this.colorIndex1 = 0;
    this.colorIndex2 = 0;
    this.textures = [new THREE.TextureLoader().load(img1), new THREE.TextureLoader().load(img2)];
    this.pointsLength = 10;
  }

  // 设置键值
  setDataKeys() {
    this.mapData.features.forEach(d => {
      const { name, centroid } = d.properties;
      this.dataKeys[name] = [...centroid];
    });
  }

  /**
   * @desc 节流，防抖
   */
  doAnimate_sixline = throttle(() => {
    let ratio = this.colorIndex1 / this.pointsLength;
    this.sixLineGroup &&
      this.sixLineGroup.children.forEach(d => {
        d.scale.set(1 + ratio, 1 + ratio, d.scale.z);
        d.material.opacity = 1 - ratio;
      });

    this.colorIndex1++;
    if (this.colorIndex1 > this.pointsLength - 1) {
      this.colorIndex1 = 0;
    }
  }, 100);

  doAnimate_flygroup = throttle(() => {
    this.flyGroup &&
      this.flyGroup.children.forEach(d => {
        d.geometry.colors = new Array(this.pointsLength).fill(1).map((d, i) => {
          if (i !== this.colorIndex2) {
            return new THREE.Color(this.colors[i%9]);
          } else {
            return new THREE.Color('#fbff00');
          }
        });
        d.geometry.colorsNeedUpdate = true;
      });
    this.colorIndex2++;
    if (this.colorIndex2 > this.pointsLength - 1) {
      this.colorIndex2 = 0;
    }
  }, 100);

  /**
   * @desc 绘制6边形
   */
  drawSixMesh(x, y, z, i,color) {
    console.log(color);
    const geometry = new THREE.CircleGeometry(0.3, 600);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z + 0.1);
    return mesh;
  }

  /**
   * @desc 绘制6边线
   */
  drawSixLineLoop(x, y, z, i) {
    // 绘制六边型
    const geometry = new THREE.CircleGeometry(0.3, 600);
    const material = new THREE.MeshBasicMaterial({ color: this.colors[i % 9], transparent: true });
    geometry.vertices.shift();
    const line = new THREE.LineLoop(geometry, material);
    line.position.set(x, y, z + 0.1);
    return line;
  }

  /**
   * @desc 柱子
   */
  drawPlane(x, y, z, value, i) {
    const hei = value / 10;
    const geometry = new THREE.PlaneGeometry(1, hei);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures[i % 2],
      depthTest: false,
      transparent: true,
      color: this.colors[i % 9],
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x, y, z + hei / 2);
    plane.rotation.x = Math.PI / 2;
    plane.rotation.z = Math.PI;
    const plane2 = plane.clone();
    plane2.rotation.y = Math.PI / 2;
    return [plane, plane2];
  }

  /**
   * @desc 绘制光柱
   */
  drawLightBar() {
    const group = new THREE.Group();
    const sixLineGroup = new THREE.Group();
    var data = Object.values(this.dataKeys);
    data.forEach((d, i) => {
      const [x, y, z] = this.lnglatToMector(d);
      // 绘制六边体
      group.add(this.drawSixMesh(x, y, z, 10,this.colors[i%9]));
      // 绘制6边线
      sixLineGroup.add(this.drawSixLineLoop(x, y, z, i));

      // 绘制柱子
      const [plane1, plane2] = this.drawPlane(x, y, z, 50, i);
      group.add(plane2);
      group.add(plane1);
    });

    this.sixLineGroup = sixLineGroup;
    this.scene.add(group);
    this.scene.add(sixLineGroup);
  }

  /**
   * @desc 绘制飞线
   */
  drawFlyLine() {
    const group = new THREE.Group();
    var data = Object.values(this.dataKeys);
    data.forEach((d,i) => {
      const z = 6;
      const [x1, y1, z1] = this.lnglatToMector(d);
      const [x2, y2, z2] = this.lnglatToMector([120.749953,30.764652]);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, z),
        new THREE.Vector3(x2, y2, z2)
      );
      const points = curve.getPoints(this.pointsLength);
      const geometry = new THREE.Geometry();
      geometry.vertices = points;
      geometry.colors = new Array(points.length).fill(new THREE.Color(this.colors[i % 9]));
      const material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        linewidth: 10,
        // color: this.colors[i % 9],
        transparent: true,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Line(geometry, material);
      group.add(mesh);
    });
    this.flyGroup = group;
    this.scene.add(group);
  }
}
