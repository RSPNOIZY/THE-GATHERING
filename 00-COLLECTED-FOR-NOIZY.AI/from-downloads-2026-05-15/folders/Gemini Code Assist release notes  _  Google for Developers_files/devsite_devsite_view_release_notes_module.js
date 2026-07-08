(function(_ds){var window=this;var f3=class extends _ds.Zv{constructor(){super(["devsite-dialog","devsite-dropdown-list","devsite-view-release-notes-dialog"]);this.Bz=!1;this.releaseNotes=new Map;this.dialog=null;this.path="";this.label="Release Notes";this.disableAutoOpen=!1}Ta(){return this}async connectedCallback(){super.connectedCallback();try{this.path||(this.path=await _ds.ks(_ds.E().href)),this.releaseNotes=await _ds.fu(this.path)}catch(a){}this.releaseNotes.size===0?this.remove():(this.Bz=!0,this.disableAutoOpen||location.hash!==
"#release__notes"||this.o())}disconnectedCallback(){super.disconnectedCallback();let a;(a=this.dialog)==null||a.remove();this.dialog=null}o(a){a&&(a.preventDefault(),a.stopPropagation());let b;(b=this.dialog)==null||b.remove();this.dialog=document.createElement("devsite-dialog");this.dialog.classList.add("devsite-view-release-notes-dialog-container");_ds.gv((0,_ds.N)`
      <devsite-view-release-notes-dialog
        .releaseNotes=${this.releaseNotes}>
      </devsite-view-release-notes-dialog>
    `,this.dialog);document.body.appendChild(this.dialog);this.dialog.open=!0;this.Da({category:"Site-Wide Custom Events",action:"release notes: view note",label:`${this.path}`})}render(){if(!this.Bz)return delete this.dataset.shown,(0,_ds.N)``;this.dataset.shown="";return(0,_ds.N)`
      <button class="view-notes-button" @click="${this.o}">
        ${this.label}
      </button>
    `}};_ds.z([_ds.H(),_ds.A("design:type",Object)],f3.prototype,"Bz",void 0);_ds.z([_ds.F({type:String}),_ds.A("design:type",Object)],f3.prototype,"path",void 0);_ds.z([_ds.F({type:String}),_ds.A("design:type",Object)],f3.prototype,"label",void 0);_ds.z([_ds.F({type:Boolean,Ha:"disable-auto-open"}),_ds.A("design:type",Object)],f3.prototype,"disableAutoOpen",void 0);try{customElements.define("devsite-view-release-notes",f3)}catch(a){console.warn("devsite.app.customElement.DevsiteViewReleaseNotes",a)};})(_ds_www);
