# Routes Loader

Webpack loader to transform a directory of files to a routes object.

## Setup

The base directory must have an index file.

Any file named '_layout' will be treated as a layout component for all routes in the same directory.

Any route named '404' will have a path of '*'

### Automatically generate react-router route components

```
import routes from 'routes!./pages'

render((
  <Router history={browserHistory} routes={routes} />
), document.getElementById('react'))
```

Each route component will be loaded with require.ensure for code splitting with zero configuration

### Import a list of routes and their corresponding files

```
import routeList from 'routes?list!./pages'

routeList.forEach(route => renderToHtml(route.path))
```

This is useful for pre-rendering pages and generating a sitemap.

### Load the raw route hierarchy

```
import genericRoutes from 'routes?raw!./pages'

myCustomRouter.use(genericRoutes)
```
