// This file contains the new MySky logo as a React component.

import Svg, { Rect, G, Path, Polygon, Circle } from 'react-native-svg';

const MySkyLogo = ({ size = 120 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 768 768"
    fill="none"
  >
    <Rect width="768" height="768" rx="0" fill="#191C3A" />
    <G>
      <Path d="M192 480C192 384 288 320 384 320C480 320 576 384 576 480" stroke="#F5D77B" strokeWidth="12" fill="none"/>
      <Path d="M224 480C224 400 304 352 384 352C464 352 544 400 544 480" stroke="#F5D77B" strokeWidth="8" fill="none"/>
      <Path d="M256 480C256 416 320 384 384 384C448 384 512 416 512 480" stroke="#F5D77B" strokeWidth="6" fill="none"/>
      <Rect x="192" y="480" width="384" height="12" rx="6" fill="#F5D77B"/>
      <Rect x="224" y="504" width="320" height="8" rx="4" fill="#F5D77B"/>
      <Rect x="256" y="520" width="256" height="6" rx="3" fill="#F5D77B"/>
      <Polygon points="384,320 384,200 388,200 388,320" fill="#F5D77B"/>
      <Circle cx="384" cy="180" r="8" fill="#F5D77B"/>
      <Circle cx="384" cy="160" r="4" fill="#F5D77B"/>
      <Circle cx="404" cy="190" r="3" fill="#F5D77B"/>
      <Circle cx="364" cy="190" r="3" fill="#F5D77B"/>
    </G>
  </Svg>
);

export default MySkyLogo;
