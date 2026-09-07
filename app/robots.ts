import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{return{rules:[{userAgent:"*",allow:"/",disallow:["/admin","/api/"]}],sitemap:"https://supermercado-central.joaopaulo2009.chatgpt.site/sitemap.xml"}}
