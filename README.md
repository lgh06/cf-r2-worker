## a cf worker for r2 (v2) 
https://developers.cloudflare.com/r2/examples/demo-worker/  
https://developers.cloudflare.com/r2/api/workers/workers-api-usage/  
https://developers.cloudflare.com/workers/wrangler/install-and-update/  
https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2listoptions  

## 简要说明  
```
如果URL中以!1结尾,如 https://cf2.4r6.top/blog/2024/111.jpg!1
则去R2的路径 /blog1024 中寻找缩略图。  
如果找不到，则请求腾讯云 https://d-1251786267.file.myqcloud.com/blog/2024/111.jpg!1  （腾讯云支持!1 缩略图）, 存储在R2中.
  R2存储路径为 /blog1024， 并且文件名最后不带!1
  返回R2的响应。  


如果URL中没有以!1结尾,如 https://cf2.4r6.top/blog/2024/111.jpg
则去R2的路径 /blog 中寻找。  
如果找不到，则请求腾讯云 https://d-1251786267.file.myqcloud.com/blog/2024/111.jpg, 存储在R2中.
  R2存储路径为 /blog
  返回R2的响应。  
```