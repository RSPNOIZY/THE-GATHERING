(function(_ds){var window=this;var KJa=async function(a){a.eventHandler.listen(a,"DropdownToggled",c=>{c=c.getBrowserEvent();let d;a.Da({category:"devsiteLlmTools",action:((d=c.detail)==null?0:d.open)?"llm_tools_dropdown_open":"llm_tools_dropdown_close",label:"dropdown_toggle"})});a.eventHandler.listen(a,"DropdownItemClicked",c=>{c=c.getBrowserEvent();if(c=a.ea.get(c.detail.id))a.Da({category:"devsiteLlmTools",action:c.WH,label:c.analyticsLabel}),c.action()});const b=JJa();b&&(a.o=b,a.Da({category:"devsiteLlmTools",action:"llm_tools_button_impression"}))},
JJa=function(){const a=_ds.E();a.pathname=`${a.pathname}.md.txt`;return _ds.yf(a.href)},LJa=async function(a){if(!a.o)return null;a.Vr=!0;try{const b=await fetch(_ds.Vl(a.o.toString()).href);if(b)return await b.text()}catch(b){}finally{a.Vr=!1}return null},MJa=async function(a){try{return a.oa||(a.oa=await LJa(a)),a.oa}catch(b){}return null},FY=function(a,b){a.dispatchEvent(new CustomEvent("devsite-show-custom-snackbar-msg",{detail:{msg:b,showClose:!1},bubbles:!0}))},NJa=async function(a){a.Da({category:"devsiteLlmTools",
action:"llm_tools_copy_markdown_click",label:"main_button"});const b=await MJa(a);b?await _ds.Vt(b):FY(a,"Failed to copy page")},GY=class extends _ds.Zv{constructor(){super(...arguments);this.Vr=!1;this.eventHandler=new _ds.v;this.oa=null;this.o=void 0;this.items=[{id:"open-markdown",title:"View as Markdown",action:()=>{this.o?_ds.Jf(window,this.o,"_blank"):FY(this,"Failed to open markdown view.")},WH:"llm_tools_open_markdown_click",analyticsLabel:"dropdown_item"}];this.qa=this.items.map(a=>({id:a.id,
title:a.title}));this.ea=new Map(this.items.map(a=>[a.id,a]))}Ta(){return this}connectedCallback(){super.connectedCallback();KJa(this)}disconnectedCallback(){super.disconnectedCallback();this.eventHandler.removeAll()}render(){return(0,_ds.N)`
      <div
        class="devsite-llm-tools-container"
        role="group"
        aria-label="${"LLM Tools"}">
        <div class="devsite-llm-tools-button-container">
          <button
            type="button"
            class="button button-white devsite-llm-tools-button"
            ?disabled="${this.Vr}"
            @click=${()=>{NJa(this)}}
            aria-label="${"Copy page as markdown"}"
            data-title="${"Copy page as markdown"}">
            <span class="material-icons icon-copy" aria-hidden="true"></span>
          </button>
        </div>
        <div class="devsite-llm-tools-dropdown-container">
          <devsite-dropdown-list
            .listItems="${this.qa}"
            open-dropdown-aria-label="${"More LLM Tools options"}"
            close-dropdown-aria-label="${"Close LLM Tools options menu"}">
          </devsite-dropdown-list>
        </div>
      </div>
    `}};GY.prototype.disconnectedCallback=GY.prototype.disconnectedCallback;_ds.z([_ds.H(),_ds.A("design:type",Object)],GY.prototype,"Vr",void 0);try{customElements.define("devsite-llm-tools",GY)}catch(a){console.warn("Unrecognized DevSite custom element - DevsiteLlmTools",a)};})(_ds_www);
