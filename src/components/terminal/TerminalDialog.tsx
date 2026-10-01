import {useEffect,useRef,type ReactNode} from "react";
import {X} from "lucide-react";
export function TerminalDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const node=ref.current;(node?.querySelector<HTMLElement>('input,select')??node?.querySelector<HTMLElement>('button'))?.focus();return ()=>previous?.focus();},[]);
 return <div className="terminal-dialog-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={ref} className="terminal-dialog" role="dialog" aria-modal="true" aria-label={title} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}if(event.key==='Tab'){const nodes=[...ref.current!.querySelectorAll<HTMLElement>('button,input,select,[tabindex="0"]')].filter(node=>!node.hasAttribute('disabled'));const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}}><header><h2>{title}</h2><button className="terminal-icon" onClick={onClose} aria-label="Close / סגירה"><X size={18}/></button></header>{children}</div></div>;
}
