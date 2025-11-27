import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // ngrok 접속 허용
    // [핵심] 프록시 설정 추가
    proxy: {
      '/calculate': {
        target: 'http://127.0.0.1:8000', // 백엔드 주소
        changeOrigin: true,
        secure: false,
      }
    }
  }
})