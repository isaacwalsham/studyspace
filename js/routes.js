// walking routes along the real campus paths, found with a*
// the paths are the openstreetmap lines already in map-data.js

let pathNodes = null;
const routeCache = new Map();

// turns the path lines into a graph. every point on a line is a node,
// joined to the next point along it. lines that share a point are joined there
function buildGraph() {
  const nodes = new Map();
  const nodeAt = (x, y) => {
    const key = `${x},${y}`;
    if (!nodes.has(key)) nodes.set(key, { x, y, edges: [] });
    return nodes.get(key);
  };

  for (const lines of [MAP.path, MAP.service, MAP.road]) {
    // each line looks like "M698 173 L710 174 L720 172"
    for (const line of lines.split("M").filter(Boolean)) {
      const nums = line.replace(/L/g, " ").trim().split(/\s+/).map(Number);
      for (let i = 2; i + 1 < nums.length; i += 2) {
        const a = nodeAt(nums[i - 2], nums[i - 1]);
        const b = nodeAt(nums[i], nums[i + 1]);
        if (a === b) continue;
        // no walking through buildings, so skip any bit of path that runs inside one
        if (insideBuilding((a.x + b.x) / 2, (a.y + b.y) / 2)) continue;
        const metres = Math.hypot(a.x - b.x, a.y - b.y);
        a.edges.push({ to: b, metres });
        b.edges.push({ to: a, metres });
      }
    }
  }
  return biggestNetwork([...nodes.values()]);
}

// building outlines from map-data.js, each with a box around it so most
// buildings can be ruled out quickly
let buildings = null;
function buildingOutlines() {
  return MAP.bld.split("Z").map(shape => {
    const nums = shape.replace(/[ML]/g, " ").trim().split(/\s+/).map(Number);
    const points = [];
    for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]]);
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    return { points, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }).filter(building => building.points.length >= 3);
}

// true if x, y is inside any building. draws a line out to the right and
// counts how many walls it crosses: odd means inside, even means outside
function insideBuilding(x, y) {
  if (!buildings) buildings = buildingOutlines();
  for (const { points, left, right, top, bottom } of buildings) {
    if (x < left || x > right || y < top || y > bottom) continue;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [x1, y1] = points[i], [x2, y2] = points[j];
      if ((y1 > y) !== (y2 > y) && x < x1 + (y - y1) * (x2 - x1) / (y2 - y1)) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

// a few bits of path aren't joined to anything, so only keep the main network.
// otherwise a space could snap onto a path that leads nowhere
function biggestNetwork(nodes) {
  const seen = new Set();
  let biggest = [];
  for (const node of nodes) {
    if (seen.has(node)) continue;
    const group = [];
    const stack = [node];
    seen.add(node);
    while (stack.length) {
      const current = stack.pop();
      group.push(current);
      for (const { to } of current.edges) {
        if (!seen.has(to)) { seen.add(to); stack.push(to); }
      }
    }
    if (group.length > biggest.length) biggest = group;
  }
  return biggest;
}

// the closest point on the path network
function nearestNode(x, y) {
  if (!pathNodes) pathNodes = buildGraph();
  let best = null, bestDistance = Infinity;
  for (const node of pathNodes) {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance < bestDistance) { best = node; bestDistance = distance; }
  }
  return best;
}

// a* search, like the ai module. it always explores the node with the lowest
// distance so far + straight line to the goal. the straight line is never
// longer than the real walk, so the first time it reaches the goal is the shortest route
function aStar(start, goal) {
  const guess = node => Math.hypot(node.x - goal.x, node.y - goal.y);
  const cost = new Map([[start, 0]]);
  const cameFrom = new Map();
  const open = [start];
  const done = new Set();

  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) {
      if (cost.get(open[i]) + guess(open[i]) < cost.get(open[best]) + guess(open[best])) best = i;
    }
    const node = open.splice(best, 1)[0];

    if (node === goal) {
      // follow cameFrom back to the start to get the route
      const path = [node];
      while (cameFrom.has(path[0])) path.unshift(cameFrom.get(path[0]));
      return { path, metres: cost.get(goal) };
    }
    if (done.has(node)) continue;
    done.add(node);

    for (const { to, metres } of node.edges) {
      const newCost = cost.get(node) + metres;
      if (newCost < (cost.get(to) ?? Infinity)) {
        cost.set(to, newCost);
        cameFrom.set(to, node);
        open.push(to);
      }
    }
  }
  return null;
}

// the walking route between two things with an id, x and y, like a place and a space.
// returns { points, metres }. routes are saved so each one is only worked out once
function findRoute(from, to) {
  const key = `${from.id}>${to.id}`;
  if (routeCache.has(key)) return routeCache.get(key);

  const startNode = nearestNode(from.x, from.y);
  const endNode = nearestNode(to.x, to.y);
  const found = aStar(startNode, endNode);

  let route;
  if (found) {
    // walk from the door to the path, along the path, then from the path to the door
    const points = [[from.x, from.y], ...found.path.map(node => [node.x, node.y]), [to.x, to.y]];
    const metres = Math.hypot(startNode.x - from.x, startNode.y - from.y) + found.metres
      + Math.hypot(endNode.x - to.x, endNode.y - to.y);
    route = { points, metres };
  } else {
    // shouldn't happen, but fall back to a straight line
    route = { points: [[from.x, from.y], [to.x, to.y]], metres: Math.hypot(to.x - from.x, to.y - from.y) };
  }
  routeCache.set(key, route);
  return route;
}

// the route from where the user is to a space
function walkRoute(space) {
  return findRoute(startPlace(), space);
}
