export function appendToTag(part, item){
    const tag = document.getElementsByTagName(part)[0];
    if(tag){
        tag.appendChild(item);
    }
}

export function addCss(url){
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = url;
    css.crossOrigin = "";
    css.type = "text/css";
    appendToTag("head",css);
}

export function addRawHtml(part, html){
    document.getElementsByTagName(part)[0].innerHTML+=html;
}