"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createElement(type, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  return {
    type: type,
    props: _objectSpread(_objectSpread({}, props), {}, {
      children: children.map(function (child) {
        return _typeof(child) === "object" ? child : createTextElement(child);
      })
    })
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

var Helpers = {
  isEvent: function isEvent(key) {
    return key.startsWith("on");
  },
  isProperty: function isProperty(key) {
    return key !== "children" && !Helpers.isEvent(key);
  }
};

function createDOMElement(fiber) {
  // create element
  var dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type); // add properties

  Object.keys(fiber.props).filter(Helpers.isProperty).forEach(function (name) {
    dom[name] = fiber.props[name];
  }); // add event listeners

  Object.keys(fiber.props).filter(Helpers.isEvent).forEach(function (name) {
    var eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, fiber.props[name]);
  });
  return dom;
}

function commitFiberTree() {
  commitFiberTreeToDOM(fiberTreeRoot.child);
  fiberTreeRoot = null;
}

function commitFiberTreeToDOM(fiber) {
  if (!fiber) {
    return;
  }

  var domParent = fiber.parent.dom;

  if (fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  }

  commitFiberTreeToDOM(fiber.child);
  commitFiberTreeToDOM(fiber.sibling);
}

function render(element, container) {
  fiberTreeRoot = {
    dom: container,
    props: {
      children: [element]
    }
  };
  currentFiber = fiberTreeRoot;
}

var currentFiber = null;
var fiberTreeRoot = null;

function constructFiberTree(deadline) {
  var shouldYield = false; // construct Fiber Tree fiber by fiber in the browser's idle time

  while (currentFiber && !shouldYield) {
    currentFiber = constructFiber(currentFiber);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!currentFiber && fiberTreeRoot) {
    // when the complete fiber tree has been generated
    commitFiberTree();
  }

  requestIdleCallback(constructFiberTree);
}

requestIdleCallback(constructFiberTree);

function constructFiber(fiber) {
  // add dom node 📦, in other words set fiber node
  if (!fiber.dom) {
    fiber.dom = createDOMElement(fiber);
  } // create child fibers


  var children = fiber.props.children;
  reconcileChildren(fiber, children); // return next fiber: update currentFiber.

  if (fiber.child) {
    return fiber.child;
  } // otherwise, start moving towards the fiber root i.e. towards the 'parent'


  var nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, children) {
  var index = 0;
  var prevSibling = null;

  while (index < children.length) {
    var child = children[index];
    var newFiber = {
      type: child.type,
      props: child.props,
      dom: null,
      parent: wipFiber
    };

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (child) {
      prevSibling.sibling = newFiber;
    } // note: prevSibling acts as a pointer. 


    prevSibling = newFiber;
    index++;
  }
}

var Didact = {
  createElement: createElement,
  render: render
};
/** @jsx Didact.createElement */

var element = Didact.createElement("div", {
  id: "child"
}, Didact.createElement("h1", {
  id: "grandChild"
}, Didact.createElement("pre", {
  id: "greatGrandChild"
}, "pre \u21C6 h1 \u21C6 div \u21C6 #root"), Didact.createElement("pre", {
  id: "greatGrandChild's Sibling",
  onClick: function onClick() {
    alert('Click event was received by the anchor tag');
  }
}, "pre \u21C6 h1 \u21C6 div \u21C6 #root", Didact.createElement("br", null), "\u2193   \u2197", Didact.createElement("br", null), "pre", Didact.createElement("br", null))), Didact.createElement("pre", {
  id: "grandChild's Sibling"
}, "h1 \u21C6 div \u21C6 #root", Didact.createElement("br", null), "\u2193   \u2197", Didact.createElement("br", null), "pre ", Didact.createElement("br", null), "grandChild's Sibling has no children"));
var container = document.querySelector("#root");
Didact.render(element, container);
