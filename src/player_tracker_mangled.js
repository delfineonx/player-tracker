// Copyright (c) 2025 delfineonx
// This product includes "Player Tracker" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

{
  let _PT={
    join:()=>{},
    leave:()=>{},
    ids:null,
    checkValid:Object.create(null),
    _playerIds:[],
    id_to_name:Object.create(null),
    name_to_id:Object.create(null),
    id_to_dbid:Object.create(null),
    dbid_to_id:Object.create(null),
    positions:null,
    crouching:null,
    update:0xffffffff,
    onPlayerJoin:null,
    onPlayerLeave:null,
    tick:null
  };
  let A=Object.create(null),
  B=_PT._playerIds,
  C=_PT.checkValid,
  D=Object.create(null),
  E=Object.create(null),
  F=1,
  G=1,
  H=1,
  I=_PT.id_to_name,
  J=_PT.name_to_id,
  K=_PT.id_to_dbid,
  L=_PT.dbid_to_id,
  M=api.getPlayerIds,
  N=api.getPosition,
  O=api.isPlayerCrouching;
  _PT.ids=()=>B.slice();
  _PT.positions=()=>{
    if(G){
      let a=0,
      b=B.length,
      c;
      while(a<b){
        c=B[a];
        D[c]=N(c);
        a++
      }
      G=0
    }
    return D
  };
  _PT.crouching=()=>{
    if(H){
      let a=0,
      b=B.length,
      c;
      while(a<b){
        c=B[a];
        E[c]=O(c);
        a++
      }
      H=0
    }
    return E
  };
  _PT.onPlayerJoin=P=>{
    let a=A[P];
    if(a===void 0){a=A[P]=3>>0}
    if(a&1){
      try{
        let b=api.getEntityName(P),
        c=api.getPlayerDbId(P);
        if(!C[P]){
          let d=B.length;
          B[d]=P;
          C[P]=d+1
        }
        I[P]=b;
        J[b]=P;
        K[P]=c;
        L[c]=P;
        G=1;
        H=1;
        _PT.update=0xffffffff;
        _PT.join(P);
        A[P]=a&=~1
      }catch(e){
        A[P]=a&=~1;
        api.broadcastMessage("Player Tracker: Join handler error: "+e.name+": "+e.message,{color:"#ff9d87"})
      }
    }
  };
  _PT.onPlayerLeave=P=>{
    let a=C[P];
    if(!a){
      delete A[P];
      return
    }
    let b=A[P]>>>0;
    if(b&2){
      try{
        _PT.leave(P);
        A[P]=b&=~2
      }catch(c){
        A[P]=b&=~2;
        api.broadcastMessage("Player Tracker: Leave handler error: "+c.name+": "+c.message,{color:"#ff9d87"})
      }
    }
    let d=B.length-1,
    e=B[d];
    if(e!==P){
      B[a-1]=e;
      C[e]=a
    }
    B.length=d;
    delete C[P];
    delete A[P];
    let f=I[P],
    g=K[P];
    delete I[P];
    delete J[f];
    delete K[P];
    delete L[g];
    delete D[P];
    delete E[P];
    G=1;
    H=1;
    _PT.update=0xffffffff
  };
  _PT.tick=()=>{
    let a=M(),
    b=a.length,
    c=F+1,
    d=0,e=0,
    f,g;
    while(d<b){
      f=a[d];
      g=A[f]??3;
      if(!C[f]){
        let h=B.length;
        B[h]=f;
        C[f]=h+1
      }
      if(!(g&2)){g=3}
      A[f]=g=c<<2|g&3;
      d++
    }
    while(e<B.length){
      f=B[e];
      g=A[f];
      if(g>>>2===c){
        if(g&1){
          try{
            let i=api.getEntityName(f),
            j=api.getPlayerDbId(f);
            I[f]=i;
            J[i]=f;
            K[f]=j;
            L[j]=f;
            _PT.join(f);
            A[f]=g&=~1
          }catch(k){
            A[f]=g&=~1;
            api.broadcastMessage("Player Tracker: Join handler error: "+k.name+": "+k.message,{color:"#ff9d87"})
          }
        }
        e++;
        continue
      }
      if(g&2){
        try{
          _PT.leave(f);
          A[f]=g&=~2
        }catch(l){
          A[f]=g&=~2;
          api.broadcastMessage("Player Tracker: Leave handler error: "+l.name+": "+l.message,{color:"#ff9d87"})
        }
      }
      let m=B.length-1,
      n=B[m];
      if(m!==e){
        B[e]=n;
        C[n]=e+1
      }
      B.length=m;
      delete C[f];
      delete A[f];
      let o=I[f],
      p=K[f];
      delete I[f];
      delete J[o];
      delete K[f];
      delete L[p];
      delete D[f];
      delete E[f]
    }
    G=1;
    H=1;
    _PT.update=0xffffffff;
    F=c
  };
  Object.seal(_PT);
  globalThis.PT=_PT;
  void 0
}

