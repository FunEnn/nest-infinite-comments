import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://localhost:3000', // 后端地址
  timeout: 5000, // 超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等头信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 统一处理响应数据
    return response.data;
  },
  (error) => {
    // 统一处理错误
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default service;
