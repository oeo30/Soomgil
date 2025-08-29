// API 서비스 함수들

const API_BASE_URL = 'http://localhost:5001/api';

// API 호출 헬퍼 함수
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // 디버깅: 실제 API 요청 확인
  console.log('🌐 API 요청:', {
    url,
    method: config.method,
    body: config.body
  });

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    // JSON 응답이 아닌 경우 (파일 등)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ API 응답:', data);
      return data;
    } else {
      console.log('✅ API 응답 (파일):', response);
      return response;
    }
  } catch (error) {
    console.error('❌ API 호출 오류:', error);
    throw error;
  }
}

// 경로 추천 API
export async function recommendRoute(lat, lon, duration) {
  // 디버깅: API 호출 파라미터 확인
  console.log('🚀 API 호출 파라미터:', { lat, lon, duration });
  
  return apiCall('/routes/recommend', {
    method: 'POST',
    body: JSON.stringify({
      lat: lat,
      lon: lon,
      duration: duration
    })
  });
}

// 경로 생성 API (기존)
export async function generatePath(lat, lon) {
  return apiCall('/generate-path', {
    method: 'POST',
    body: JSON.stringify({
      lat: lat,
      lon: lon
    })
  });
}

// 경로 조회 API
export async function getPath() {
  return apiCall('/path', {
    method: 'GET'
  });
}

// 경로 설명 조회 API
export async function getDescription() {
  return apiCall('/description', {
    method: 'GET'
  });
}

// 음악 생성 API
export async function generateMusic(mood = "mysterious and cinematic") {
  return apiCall('/generate-music', {
    method: 'POST',
    body: JSON.stringify({
      mood: mood
    })
  });
}

// 통계 정보 조회 API
export async function getStatistics() {
  return apiCall('/statistics', {
    method: 'GET'
  });
}

// 헬스 체크 API
export async function healthCheck() {
  return apiCall('/health', {
    method: 'GET'
  });
}

// 개인화 메시지 API
export async function getPersonalizedMessages(userHistory) {
  return apiCall('/personalized-messages', {
    method: 'POST',
    body: JSON.stringify({
      user_history: userHistory
    })
  });
}

// 시간대별 경로 추천 API
export async function generateDurationRoute(startLat, startLon, userPreference) {
  console.log('🚀 시간대별 경로 추천 API 호출:', { startLat, startLon, userPreference });
  
  return apiCall('/duration-route', {
    method: 'POST',
    body: JSON.stringify({
      start_lat: startLat,
      start_lon: startLon,
      user_preference: userPreference
    })
  });
}
