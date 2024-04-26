/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface Env {
  MY_BUCKET: R2Bucket
}

function objectNotFound(objectName: string): Response {
  return new Response(`<html><body>R2 object "<b>${objectName}</b>" not found</body></html>`, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=UTF-8'
    }
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {

    const url = new URL(request.url)
    let pwd = url.searchParams.get('pwd') ?? undefined;

    if (url.pathname.startsWith("/blog")  // /blog 路径公开
      || pwd == Number(parseInt("" + Date.now() / (3600 * 1000 * 24), 10)).toString(18).toUpperCase()
    ) {

    } else {
      return new Response('forbidden Number(parseInt("" + Date.now()/(3600 * 1000 * 24),10)).toString(**).to*****()', { status: 403 })
    }

    const objectName = url.pathname.slice(1) // remove first / in pathname
    let objectNameWithoutMark = objectName.substring(0, objectName.length - 2); // remove end !1  so it is blog/2024/111.jpg Now


    console.log(`${request.method} object ${objectName}: ${request.url}`)

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (objectName === '') {
        return new Response(undefined, { status: 400 })
      }

      if (request.method === 'GET') {
        let object;
        if (objectName.endsWith("!1")) {
          // blog/2024/111.jpg 去 blog1024/2024/111.jpg 取
          let objectNameReRouted = objectNameWithoutMark.replace( objectNameWithoutMark.split("/")[0], objectNameWithoutMark.split("/")[0] + "1024");
          object = await env.MY_BUCKET.get(objectNameReRouted, {
            range: request.headers,
            onlyIf: request.headers,
          });
          if (object === null) {
            // 请求腾讯云
            // url.pathname 开头带斜杠   objectName 开头不带斜杠
            try {
              let res = await fetch("https://d-1251786267.file.myqcloud.com" + url.pathname);
              if(res.status !== 200){
                return objectNotFound(objectName)
              }
              let arrayBuf = await res.arrayBuffer();
  
              await env.MY_BUCKET.put(objectNameReRouted, arrayBuf, {
                httpMetadata: {
                  cacheControl: "max-age=2592000",
                }
              })
  
              object = await env.MY_BUCKET.get(objectNameReRouted, {
                range: request.headers,
                onlyIf: request.headers,
              });
            } catch (error) {
              return objectNotFound(objectName)
            }
          }
        } else {
          object = await env.MY_BUCKET.get(objectName, {
            range: request.headers,
            onlyIf: request.headers,
          })

          if (object === null) {
            // 请求腾讯云
            try {
              let res = await fetch("https://d-1251786267.file.myqcloud.com" + url.pathname);
              if(res.status !== 200){
                return objectNotFound(objectName)
              }
              let arrayBuf = await res.arrayBuffer();
  
              await env.MY_BUCKET.put(objectName, arrayBuf, {
                httpMetadata: {
                  cacheControl: "max-age=2592000",
                }
              })
              object = await env.MY_BUCKET.get(objectName, {
                range: request.headers,
                onlyIf: request.headers,
              })
            } catch (error) {
              return objectNotFound(objectName)
            }

            
          }
        }

        if(object === null){
          return objectNotFound(objectName)
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        if (object.range) {
          headers.set("content-range", `bytes ${object.range.offset}-${object.range.end ?? object.size - 1}/${object.size}`)
        }
        headers.set('cache-control', "max-age=2592000")
        headers.delete("report-to")
        headers.delete("nel")
        headers.delete("priority")
        headers.delete("date")
        headers.delete("server")
        const status = object.body ? (request.headers.get("range") !== null ? 206 : 200) : 304
        return new Response(object.body, {
          headers,
          status
        })
      }



      // below is request method HEAD
      const object = await env.MY_BUCKET.head(objectName)

      if (object === null) {
        return objectNotFound(objectName)
      }

      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      return new Response(null, {
        headers,
      })
    }
    return new Response(`Unsupported method`, {
      status: 400
    })
  }
}
