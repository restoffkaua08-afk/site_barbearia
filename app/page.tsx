"use client";

import { useState } from "react";
import "./e01.css";

const cuts = [
  { name: "Degradê clássico", type: "Corte", time: "45 min", desc: "Transição limpa nas laterais, acabamento preciso e topo definido.", img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85" },
  { name: "Corte social", type: "Corte", time: "40 min", desc: "Linhas elegantes, volume controlado e finalização natural.", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=85" },
  { name: "Barba esculpida", type: "Barba", time: "30 min", desc: "Desenho, toalha quente e alinhamento com navalha.", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85" },
  { name: "Corte + textura", type: "Finalização", time: "50 min", desc: "Movimento no topo com textura leve e fixação sem brilho.", img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85" },
];
const orbit = [...cuts, ...cuts, ...cuts, ...cuts, ...cuts];

export default function Home() {
  const [activeStyle, setActiveStyle] = useState(0);

  return <main className="nilles-site">
    <header className="nilles-nav">
      <a className="nilles-brand" href="#inicio"><img src="/logo-bn-gold.png" alt=""/><span>Barbearia Nilles</span><small>Gold</small></a>
      <nav aria-label="Navegação principal"><a href="#inicio">Início</a><a href="#estilos">Estilos</a><a href="#servicos">Serviços</a><a href="#inspiracao">Inspiração</a></nav>
      <a className="gold-button compact" href="#servicos">Agendar horário</a>
    </header>

    <section id="inicio" className="nilles-hero">
      <div className="hero-backdrop" role="img" aria-label="Barbeiro realizando um corte"></div>
      <div className="nilles-hero-copy">
        <span className="gold-kicker">Barbearia contemporânea · Contagem</span>
        <h1>Seu estilo,<br/><em>bem definido.</em></h1>
        <p>Cortes precisos, barba alinhada e finalizações que respeitam sua identidade. Precisão em cada detalhe.</p>
        <div className="hero-buttons"><a className="gold-button" href="#servicos">Ver serviços ↗</a><a className="outline-button" href="#estilos">Explorar estilos ↓</a></div>
        <div className="opening-hours"><span>TER — SÁB</span><strong>09:00 — 20:00</strong></div>
      </div>
    </section>

    <section id="estilos" className="e01-section">
      <div className="e01-heading">
        <h2>Explore seu estilo</h2>
        <p>Escolha uma categoria e encontre referências para o seu próximo visual.</p>
      </div>
      <div className="e01-navigation" role="tablist" aria-label="Escolha um estilo">
        {([["✦","Clássicos"],["N","Modernos"],["B","Barbas"],["T","Texturas"],["C","Combos"]]).map(([icon,label], index) => <button key={label} type="button" role="tab" aria-selected={activeStyle === index} className={activeStyle === index ? "active" : ""} onClick={() => setActiveStyle(index)}><span className="e01-orb-icon" aria-hidden="true">{icon}</span><span>{label}</span></button>)}
      </div>
      <div className="e01-divider" aria-hidden="true"><span/></div>
      <div className="e01-carousel">
        <div className="e01-scene">
          <div className="e01-ring">
            {orbit.map((cut, i) => <a className="e01-panel" style={{"--panel-index": i} as React.CSSProperties} key={i} href={`/agendamento?servico=${i % cuts.length}`}><img src={cut.img} alt=""/><span><small>{cut.type}</small>{cut.name}</span></a>)}
          </div>
        </div>
      </div>
    </section>

    <section id="servicos" className="nilles-services">
      <div className="light-heading"><span className="gold-kicker">Menu da casa</span><h2>Cortes & Finalizações</h2><p>Escolha o serviço e reserve um horário disponível em poucos passos.</p></div>
      <div className="service-table">
        <div className="service-head"><span>Visual</span><span>Serviço</span><span>Detalhes</span><span>Ação</span></div>
        {cuts.map((cut, i) => <article className="light-service-row" key={cut.name}><img src={cut.img} alt={cut.name}/><div><small>{cut.type} · 0{i+1}</small><h3>{cut.name}</h3><span>{cut.time}</span></div><p>{cut.desc}</p><a className="gold-button compact" href={`/agendamento?servico=${i}`}>Agendar ↗</a></article>)}
      </div>
    </section>

    <section id="inspiracao" className="c03-section">
      <div className="c03-heading"><img src="/logo-bn-gold.png" alt="Monograma BN"/><span className="gold-kicker">Inspirações em movimento</span><h2>Encontre seu próximo corte.</h2><p>Uma seleção contínua de estilos e acabamentos da Barbearia Nilles.</p></div>
      <div className="c03-carousel"><div className="c03-scene"><div className="c03-ring">{orbit.map((cut, i) => <article className="c03-panel" style={{"--panel-index": i} as React.CSSProperties} key={i}><img src={cut.img} alt=""/><span><small>{cut.type}</small>{cut.name}</span></article>)}</div></div></div>
    </section>

    <section id="contato" className="ct02-contact" data-catalogo-s-model="CT02">
      <div className="ct02-glow" aria-hidden="true"/>
      <div className="ct02-wrap">
        <div className="ct02-intro"><span className="gold-kicker">Fale com a Nilles</span><h2>Escolha o canal.<br/>A conversa começa daqui.</h2><p>Tire dúvidas, consulte horários ou agende seu próximo corte pelo canal que for mais prático para você.</p></div>
        <nav className="ct02-stack" aria-label="Canais de contato">
          <a className="ct02-card whatsapp" href="https://wa.me/?text=Olá%2C%20quero%20falar%20com%20a%20Barbearia%20Nilles" target="_blank" rel="noreferrer"><span className="ct02-icon" aria-hidden="true">WA</span><span className="ct02-meta"><strong>WhatsApp</strong><span>Conversa rápida e atendimento</span></span><span className="ct02-arrow">↗</span></a>
          <a className="ct02-card instagram" href="#inicio"><span className="ct02-icon" aria-hidden="true">IG</span><span className="ct02-meta"><strong>Instagram</strong><span>Acompanhe cortes e novidades</span></span><span className="ct02-arrow">↗</span></a>
          <a className="ct02-card schedule" href="#servicos"><span className="ct02-icon" aria-hidden="true">AG</span><span className="ct02-meta"><strong>Agendamento</strong><span>Escolha serviço, data e horário</span></span><span className="ct02-arrow">↗</span></a>
          <a className="ct02-card email" href="mailto:restoffkaua08@gmail.com"><span className="ct02-icon" aria-hidden="true">@</span><span className="ct02-meta"><strong>E-mail</strong><span>Contato formal e informações</span></span><span className="ct02-arrow">↗</span></a>
        </nav>
      </div>
    </section>

    <footer id="catalogo-f01" className="f01-footer" data-catalogo-s-model="F01">
      <div className="f01-wrap">
        <div className="f01-main">
          <section className="f01-brand"><a className="f01-logo" href="#inicio"><img src="/logo-bn-gold.png" alt="Monograma BN"/><span>Barbearia Nilles</span></a><p>Cortes precisos, barba alinhada e finalizações que respeitam a sua identidade.</p></section>
          <nav className="f01-col" aria-label="Navegação"><h3>Navegação</h3><ul><li><a href="#inicio">Início</a></li><li><a href="#estilos">Estilos</a></li><li><a href="#servicos">Serviços</a></li><li><a href="#contato">Contato</a></li></ul></nav>
          <nav className="f01-col" aria-label="Serviços"><h3>Serviços</h3><ul><li><a href="#servicos">Degradê clássico</a></li><li><a href="#servicos">Corte social</a></li><li><a href="#servicos">Barba esculpida</a></li><li><a href="#servicos">Corte e textura</a></li></ul></nav>
          <nav className="f01-col" aria-label="Atendimento"><h3>Atendimento</h3><ul><li><a href="#servicos">Agendar horário</a></li><li><a href="#contato">Falar com a equipe</a></li><li><a href="#inspiracao">Inspirações</a></li><li><a href="mailto:restoffkaua08@gmail.com">Enviar e-mail</a></li></ul></nav>
          <nav className="f01-col" aria-label="Horários"><h3>Horários</h3><ul><li><span>Terça a sexta</span></li><li><span>09:00 — 20:00</span></li><li><span>Sábado</span></li><li><span>09:00 — 20:00</span></li></ul></nav>
        </div>
        <div className="f01-contact"><div><strong>Atendimento</strong><span>restoffkaua08@gmail.com · Contagem, MG</span></div><div className="f01-social"><a href="#contato" aria-label="WhatsApp">WA</a><a href="#contato" aria-label="Instagram">IG</a><a href="mailto:restoffkaua08@gmail.com" aria-label="E-mail">@</a></div></div>
        <div className="f01-bottom"><span>© 2026 Barbearia Nilles. Todos os direitos reservados.</span><nav><a href="#inicio">Voltar ao início</a><a href="#servicos">Agendar</a><a href="#contato">Contato</a></nav></div>
      </div>
    </footer>
  </main>;
}
