"use client";

import Link from "next/link";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { SIMULATION_CAREERS, CATALOG_GROUPS, careerCatalogHref, moduleCareers, modulesForCareer, type SimulationCareer } from "@/src/lib/simulationCatalog";
import styles from "./catalog.module.css";

export default function CareerCatalog({ career }: { career?: SimulationCareer }) {
  const [query, setQuery] = useState("");
  const selected = SIMULATION_CAREERS.find(item => item.id === career);
  const modules = career ? modulesForCareer(career, query) : [];
  return <div className="psyke-workspace"><Sidebar/><main className={styles.catalog} data-testid="career-catalog">
    <header className={styles.header}><div><p className={styles.eyebrow}>PSYKE / CATÁLOGO DE SIMULADORES</p><h1>{selected ? `Simuladores de ${selected.label}` : "Una ruta para cada carrera."}</h1><p>{selected?.description ?? "Encuentra tu práctica de Enfermería, Medicina o Psicología en un mismo lugar."}</p></div><Link href="/dashboard">Volver al inicio ↗</Link></header>
    <nav className={styles.careers} aria-label="Carreras">{SIMULATION_CAREERS.map(item => <Link href={careerCatalogHref(item.id)} key={item.id} aria-current={career === item.id ? "page" : undefined} className={styles.career} style={{ "--career-color": item.color } as React.CSSProperties}><span className={styles.careerMark} aria-hidden="true">{item.label.slice(0, 1)}</span><strong>{item.label}</strong><span>{modulesForCareer(item.id).length} módulos</span><span aria-hidden="true">↗</span></Link>)}</nav>
    {!selected ? <section className={styles.overview}><p className={styles.eyebrow}>ELIGE DÓNDE QUIERES PRACTICAR</p><h2>Tu carrera, tus objetivos de aprendizaje.</h2><p>Selecciona una carrera para ver sus simuladores organizados por tipo de práctica. Los recursos compartidos aparecen en las carreras donde pueden resultar útiles.</p><div className={styles.overviewGrid}>{SIMULATION_CAREERS.map(item => <article key={item.id}><h3>{item.label}</h3><p>{item.description}</p><ul>{modulesForCareer(item.id).slice(0, 3).map(module => <li key={module.id}>{module.label}</li>)}</ul><Link href={careerCatalogHref(item.id)}>Explorar {item.label} →</Link></article>)}</div></section> : <>
      <div className={styles.toolbar}><label htmlFor="catalog-search">Buscar en {selected.label}<input id="catalog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nombre, habilidad o tipo de práctica…"/></label><p role="status">{modules.length} {modules.length === 1 ? "módulo disponible" : "módulos disponibles"}</p></div>
      <p className={styles.note}>La categoría organiza los recursos de aprendizaje. Cambiar de carrera no modifica tu perfil ni tus permisos de acceso.</p>
      <nav className={styles.groupLinks} aria-label="Tipos de práctica">{CATALOG_GROUPS.filter(group => modules.some(module => module.group === group.id)).map(group => <a key={group.id} href={`#catalog-${group.id}`}>{group.label}<span>{modules.filter(module => module.group === group.id).length}</span></a>)}</nav>
      {CATALOG_GROUPS.map(group => {
        const items = modules.filter(module => module.group === group.id);
        if (!items.length) return null;
        return <section key={group.id} id={`catalog-${group.id}`} className={styles.group} aria-label={group.label}><div className={styles.groupHeading}><h2>{group.label}</h2><span>{items.length}</span></div><p>{group.description}</p><div className={styles.moduleGrid}>{items.map(module => {
          const shared = moduleCareers(module.id).filter(item => item.id !== career);
          return <Link href={module.href} className={styles.moduleCard} key={module.id} data-module={module.id}><div className={styles.cardTop}><span>{module.count != null ? `${module.count} ${module.countLabel ?? "recursos"}` : "Práctica interactiva"}</span><span aria-hidden="true">↗</span></div><h3>{module.label}</h3><p>{module.summary}</p><div className={styles.cardFooter}><span className={styles.shared}>{shared.length ? `Compartido con ${shared.map(item => item.label).join(" y ")}` : `Enfoque de ${selected.label}`}</span><strong>Abrir simulador <span aria-hidden="true">→</span></strong></div></Link>;
        })}</div></section>;
      })}
      {!modules.length && <div className={styles.empty}><h2>No encontramos módulos con esa búsqueda.</h2><p>Prueba otro término o consulta otra carrera.</p><button onClick={() => setQuery("")}>Limpiar búsqueda</button></div>}
    </>}
  </main></div>;
}
