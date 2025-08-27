// 간단한 데모 경로(서울 예시 좌표)
export function buildMockPath({ season, length, structure }) {
  const base = [
    [37.5679, 127.0500],
    [37.5689, 127.0550],
    [37.5710, 127.0600],
    [37.5730, 127.0580],
    [37.5715, 127.0525],
  ];
  // length/structure에 따라 변형 로직을 넣고 싶으면 여기서 가공
  return base;
}
