import './index.less';

import ThreeMapLightBar from './ThreeMapLightBar.js';

// 打包的时候，此代码不载入
if (process.env.NODE_ENV === 'development') {
  import('./index.html');
}


$.get('/assets/map/ljpt_xz.json', d => {
  // const mapData = util.decode(d);
  const mapData = d;
  const map = new ThreeMapLightBar({ mapData });
  map.on('mouseenter', (e, g) => {
    console.log(g);
    map.setAreaColor(g);
  });

  // 绘制光柱
  map.drawLightBar();

  // 绘制线条
  map.drawFlyLine();

});

console.log('ok~~~');
