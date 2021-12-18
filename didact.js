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

const Helpers = {
  isEvent: key => key.startsWith("on"),
  isProperty: key => 
    key !== "children" && !Helpers.isEvent(key)
}

function createDOMElement(fiber) {
  // create element
  const dom = 
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)
  // add properties
  Object.keys(fiber.props)
    .filter(Helpers.isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })
  // add event listeners
  Object.keys(fiber.props)
    .filter(Helpers.isEvent)
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        fiber.props[name]
      )
    })  
  
  return dom
}

function commitFiberTree() {
  commitFiberTreeToDOM(fiberTreeRoot.child)
  fiberTreeRoot = null
}

function commitFiberTreeToDOM(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
  if (fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  }

  commitFiberTreeToDOM(fiber.child)
  commitFiberTreeToDOM(fiber.sibling)
}

function render(element, container) {
fiberTreeRoot = {
  dom: container,
  props: {
    children: [element]
  }
}

currentFiber = fiberTreeRoot
}

let currentFiber = null
let fiberTreeRoot = null

function constructFiberTree(deadline) {
  let shouldYield = false
  // construct Fiber Tree fiber by fiber in the browser's idle time
  while (currentFiber && !shouldYield) {
    currentFiber = constructFiber(
      currentFiber
    )
    
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!currentFiber && fiberTreeRoot) {
    // when the complete fiber tree has been generated
    commitFiberTree()
  }

  requestIdleCallback(constructFiberTree)
}

requestIdleCallback(constructFiberTree)

function constructFiber(fiber) {
  // add dom node 📦, in other words set fiber node
  if (!fiber.dom) {
    fiber.dom = createDOMElement(fiber)
  }

  // create child fibers
  const children = fiber.props.children
  reconcileChildren(fiber, children)

  // return next fiber: update currentFiber.
  if (fiber.child) {
    return fiber.child
  }
  // otherwise, start moving towards the fiber root i.e. towards the 'parent'
  let nextFiber = fiber
  while(nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

}

function reconcileChildren(wipFiber, children) {
  let index = 0
  let prevSibling = null
  while (index < children.length) {
    const child = children[index]

    let newFiber = {
      type: child.type,
      props: child.props,
      dom: null,
      parent: wipFiber
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (child) {
      prevSibling.sibling = newFiber
    }
    // note: prevSibling acts as a pointer. 
    prevSibling = newFiber
    index++
  }
}

const Didact = {
  createElement,
  render
}

/** @jsx Didact.createElement */
const element = (
  <div id="child">
    <h1 id="grandChild">
      <pre id="greatGrandChild">
        pre ⇆ h1 ⇆ div ⇆ #root
      </pre>
      <pre id="greatGrandChild's Sibling" onClick={() => {alert('Click event was received by the anchor tag')}}>
        pre ⇆ h1 ⇆ div ⇆ #root<br/>
        ↓   ↗<br/>
        pre<br/>
      </pre>
    </h1>
    <pre id="grandChild's Sibling">
      h1 ⇆ div ⇆ #root<br/>
      ↓   ↗<br/>
      pre <br/>
      grandChild's Sibling has no children
    </pre>
  </div>
)

const container = document.querySelector("#root")

Didact.render(element, container)