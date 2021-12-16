function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => 
        typeof child === "object"
          ? child
          : createTextElement(child)
      )
    }
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

const Didact = {
  createElement
}

/** @jsx Didact.createElement */
const element = (
  <h1 title="foo">
    Hello
  </h1>
)

const container = document.querySelector("#root")

const node = document.createElement(element.type)
node["title"] = element.props.title

const text = document.createTextNode("")
text["nodeValue"] = element.props.children[0].props.nodeValue

node.appendChild(text)
container.appendChild(node)