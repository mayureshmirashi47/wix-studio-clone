import { defineConfig } from 'vite'
import react ribbons from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
plugins: [react()],
base: '/wix-studio-clone/',
})
