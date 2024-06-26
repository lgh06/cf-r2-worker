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

		if(  url.pathname.startsWith("/blog")  // /blog 路径公开
        || pwd == Number(parseInt("" + Date.now()/(3600 * 1000 * 24),10)).toString(18).toUpperCase()
    ){

		}else{
			return new Response('forbidden Number(parseInt("" + Date.now()/(3600 * 1000 * 24),10)).toString(**).to*****()', { status: 403 })
		}

    const objectName = url.pathname.slice(1) // remove first / in pathname

    console.log(`${request.method} object ${objectName}: ${request.url}`)

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (objectName === '') {
        if (request.method == 'HEAD') {
          return new Response(undefined, { status: 400 })
        }

        const options: R2ListOptions = {
          prefix: url.searchParams.get('prefix') ?? url.searchParams.get('path') ?? undefined,
          delimiter: url.searchParams.get('delimiter') ?? undefined,
          cursor: url.searchParams.get('cursor') ?? undefined,
          include: undefined //['customMetadata', 'httpMetadata'],
        }
				let json = url.searchParams.get('json') ?? undefined;
        console.log(JSON.stringify(options))

        const listing = await env.MY_BUCKET.list(options)
				if(json){
					return new Response(JSON.stringify(listing), {headers: {
						'content-type': 'application/json; charset=UTF-8',
					}})
				}else{
					if(listing && listing.objects && listing.objects.length){
						return new Response(listing.objects.map(o => `<a href="${o.key}?pwd=${pwd}">`+o.key+'</a>').join('<br/>'), {headers: {
							'content-type': 'text/html; charset=UTF-8',
						}})
					}
				}
      }

      if (request.method === 'GET') {
        const object = await env.MY_BUCKET.get(objectName, {
          range: request.headers,
          onlyIf: request.headers,
        })

        if (object === null) {
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
    // if (request.method === 'PUT' || request.method == 'POST') {
    //   const object = await env.MY_BUCKET.put(objectName, request.body, {
    //     httpMetadata: request.headers,
    //   })
    //   return new Response(null, {
    //     headers: {
    //       'etag': object.httpEtag,
    //     }
    //   })
    // }
    // if (request.method === 'DELETE') {
    //   await env.MY_BUCKET.delete(url.pathname.slice(1))
    //   return new Response()
    // }

    return new Response(`Unsupported method`, {
      status: 400
    })
  }
}
