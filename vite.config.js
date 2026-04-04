import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // 根据当前工作目录中的 `mode` 加载 .env 文件
    // 第二个参数为 '.env' 文件所在的目录
    const env = loadEnv(mode, process.cwd() + '/src/env')

    return {
        plugins: [
            react(),

        ],
        css: {
            preprocessorOptions: {
                less: {
                    additionalData: `@import "./src/theme/variables.less";`,
                    javascriptEnabled: true,
                }
            }
        },
        resolve: {
            alias: {
                '@': '/src',
            }
        },
        envDir: './src/env',
        server: {
            host: env.VITE_HOST, // 允许局域网访问
            port: 8080,
            proxy: {
                // 将所有以 /api 开头的请求转发到目标服务器
                '/api': {
                    target: env.VITE_SERVER_BASE_URL, // 使用 .env 文件中定义的值
                    changeOrigin: true,                    // 允许跨域
                    rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径：去掉 /api 前缀
                },
            },
            allowedHosts: [
                'www.momostudy.test',
            ],
        },
    }
})
