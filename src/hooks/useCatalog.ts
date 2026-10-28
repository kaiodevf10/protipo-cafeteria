import {useEffect,useReducer} from 'react';
import {catalogStatus,initializeCatalog,onCatalogChange} from '../lib/catalog';
export function useCatalog(){const[,render]=useReducer(n=>n+1,0);useEffect(()=>{const unsubscribe=onCatalogChange(render);const stop=initializeCatalog();return()=>{unsubscribe();stop()}},[]);return catalogStatus()}
