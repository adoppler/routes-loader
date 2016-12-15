const path = require('path')
const dtree = require('directory-tree')

function treeToRoutes(tree, root, ctx, level = '') {
  const route = {
    path: level || '/',
    childRoutes: [],
  }

  if (tree.children) {
    tree.children.forEach(child => {
      const file = child.path.replace(root, ctx)
      const uri = child.name.replace(/\..+$/, '')

      if (child.children) {
        route.childRoutes.push(treeToRoutes(child, root, ctx, uri))
      } else if (file.match(/\.(js|jsx|coffee|cjsx|es|es6|html|markdown|mdown|md|txt|text)$/)) {
        const component = { file }

        switch (uri) {
          case '_layout':
            route.component = component
            break
          case 'index':
            route.indexRoute = component
            break
          case '404':
            route.childRoutes.push({ component, path: '*' })
            break
          default:
            route.childRoutes.push({ path: uri, component })
            break
        }
      }
    })
  }

  route.childRoutes.sort((a, b) => {
    if (a.path === '*') {
      return 1
    } else if (b.path === '*') {
      return -1
    }
    return 0
  })

  return route
}

function routeList(routes) {
  return [routes].reduce(function reduceRoutes(list, route) {
    const uri = route.path
    const parent = uri === '/' ? '' : uri

    if (route.childRoutes) {
      let index
      if (route.indexRoute) {
        index = {
          path: uri,
          file: route.indexRoute.file,
        }
      }

      const children = route.childRoutes.map(reduceRoutes.bind(null, list)).map(child =>
        child.map(c => ({
          path: `${parent}/${c.path}`,
          file: c.file,
        }))
      )

      return [].concat.apply(index ? [index] : [], children)
    }

    if (uri === '*') {
      return list.concat({
        path: uri.replace('*', '404'),
        file: route.component.file,
      })
    }

    return list.concat({
      path: uri,
      file: route.component.file,
    })
  }, [])
}

function reactRouterRoutes(routes) {
  return JSON.stringify(routes, (k, v) => {
    if (k === 'component' || k === 'indexRoute') {
      return v.file
    }
    return v
  }, 2).replace(/(\s+)"(component|indexRoute)": (".+")/g, (match, whitespace, type, file) => {
    const indent = whitespace.replace('\n', '')

    let loaderFn
    let loaderCb
    if (type === 'component') {
      loaderFn = 'getComponent'
      loaderCb = 'cb(null, page.default || page)'
    } else {
      loaderFn = 'getIndexRoute'
      loaderCb = 'cb(null, { component: page.default || page })'
    }

    return `${whitespace}${loaderFn}: function (nextState, cb) {
${indent}  require.ensure([], function (require) {
${indent}    const page = require(${file})
${indent}    ${loaderCb}
${indent}  })
${indent}}`
  })
}

function transformResult(routes, query) {
  if (query.indexOf('?raw') === 0) {
    return JSON.stringify(routes, null, 2)
  } else if (query.indexOf('?list') === 0) {
    return JSON.stringify(routeList(routes), null, 2)
  }

  return reactRouterRoutes(routes)
}

module.exports = function RoutesLoader() {
  const root = path.join(this.resourcePath, '..')

  const tree = dtree(root)
  const routes = treeToRoutes(tree, root, this.context)

  this.addContextDependency(root)
  return `module.exports = ${transformResult(routes, this.query)}\n`
}
