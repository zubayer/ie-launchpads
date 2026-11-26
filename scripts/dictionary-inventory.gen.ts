import { writeFileSync } from 'node:fs'
import { it, expect } from 'vitest'
import { DICTIONARY, dictionaryAudit } from '../src/lib/dictionary'
import { CONCEPTS } from '../src/content'
it('generates a curriculum terminology inventory',()=>{
  const rows=dictionaryAudit()
  expect(rows.length).toBe(CONCEPTS.length)
  const esc=(s:string)=>s.replace(/\|/g,'\\|').replace(/\n/g,' ')
  const lines=['# Engineering dictionary inventory','','Generated from current curriculum; presence is not independent verification. Formula-symbol gaps and suspicious titles are review candidates, not automatically missing acronyms.','', 'Topics: '+rows.length+' · Entries: '+DICTIONARY.length+' · Individually referenced entries: '+DICTIONARY.filter(e=>e.source).length,'','| ID | Topic | Entries | Abbreviations | Notation | Formula lacks lesson variables | Title review candidate |','| --- | --- | ---: | ---: | ---: | --- | --- |',...rows.map(r=>'| '+[r.id,esc(r.topic),r.entries,r.acronyms,r.notation,r.formulaWithoutLessonSymbols?'yes':'—',r.titleReview?'yes':'—'].join(' | ')+' |'),'']
  writeFileSync('docs/DICTIONARY-INVENTORY.md',lines.join('\n'))
})
