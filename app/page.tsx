import Link from 'next/link'
export default function Home() {
  return (
    <main style={{minHeight:'100vh', background:'#050505', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Inter, system-ui'}}>
      <div style={{width:'100%', maxWidth:'640px', textAlign:'center'}}>
        {/* LOGO - same good size, closer */}
        <img 
          src="/logo.png" 
          alt="TapVinci" 
          style={{width:'200px', maxWidth:'55vw', height:'auto', margin:'0 auto 14px', display:'block'}} 
        />
        {/* ONE LINE - smaller, closer */}
        <h1 style={{
          fontSize:'clamp(18px, 4.5vw, 26px)', 
          fontWeight:800, 
          margin:'0 0 10px', 
          lineHeight:1.2, 
          whiteSpace:'nowrap',
          letterSpacing:'-0.01em'
        }}>
          Tap. Connect. Remember.
        </h1>
        {/* ONE LINE - downsized */}
        <p style={{
          fontSize:'clamp(7.5px, 1.9vw, 10px)', 
          lineHeight:1.5, 
          color:'#9a9a9a',
          margin:'0 0 20px',
          whiteSpace:'nowrap',
          letterSpacing:'0.04em',
          overflow:'hidden',
          textOverflow:'ellipsis'
        }}>
          A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026
        </p>
        <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
          <Link href="/dashboard" style={{background:'#D4AF37', color:'#000', padding:'10px 20px', borderRadius:'999px', fontWeight:700, fontSize:'13px', textDecoration:'none'}}>Open Dashboard</Link>
          <Link href="/shua" style={{border:'1px solid #27272a', padding:'10px 20px', borderRadius:'999px', fontWeight:700, fontSize:'13px', textDecoration:'none', color:'#fff'}}>View Demo</Link>
        </div>
      </div>
    </main>
  )
}