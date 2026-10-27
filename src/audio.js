let ctx, musicTimer, step=0, settings={sound:true,music:true}, active=false;
export function configureAudio(value){settings=value;if(!settings.music||!active)stopMusic();else startMusic();}
export function unlockAudio(){try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();ctx.resume();active=true;if(settings.music)startMusic();}catch{}}
function note(freq,duration=.15,type='sine',volume=.045,delay=0){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+duration+.02);}
export function sound(kind){if(!settings.sound||!active||!ctx)return;const tones={tap:[523],add:[523,659],cook:[196,294],ready:[659,784],coin:[784,1046,1318],bad:[220,174],open:[392,523],level:[523,659,784,1046]};(tones[kind]||tones.tap).forEach((n,i)=>note(n,kind==='level'?.45:.18,'sine',.055,i*.07));}
function startMusic(){if(musicTimer||!ctx)return;const melody=[523,0,659,784,659,0,587,0,523,0,440,523,392,0,0,0,440,0,523,659,587,0,523,0,392,440,523,0,0,0,0,0];musicTimer=setInterval(()=>{if(document.hidden)return;const n=melody[step%melody.length];if(n)note(n,.55,'sine',.017);if(step%4===0)note([131,175,147,196][Math.floor(step/8)%4],1.3,'triangle',.018);step++;},310);}
function stopMusic(){clearInterval(musicTimer);musicTimer=null;}
export function suspendAudio(){stopMusic();ctx?.suspend();}
export function resumeAudio(){if(active){ctx?.resume();if(settings.music)startMusic();}}

