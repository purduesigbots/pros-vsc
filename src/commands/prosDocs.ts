import { listenerCount } from "process";

class Node{
    parent: Node|null = null;
    children: Node[]|null = null;
    value: string = "";
    constructor(p: Node|null, c:[Node]|null, s: string = ""){
        this.parent = p;
        this.children = c;
        this.value = s;
    }
    setChild(child:Node) {
        this.children?.push(child);
    }
    setParent(parent:Node){
        this.parent = parent;
    }

}
class Tree{
    root: Node = new Node(null,null);
    constructor(){
        this.root.value = "C++";
        this.root.children = [new Node(this.root,null,"temp child")];
    }
    addRootLayer(layerValues: [string], layerParent: string){
        ;
        for(let i = 0; i < layerValues.length; i++){
            var newChild = new Node(null, null, layerParent[i]);
            this.root.children?.push(newChild);
        }
        this.root.children = this.root.children!.slice(1);
    }
    

}