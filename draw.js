
/**********************************************************************
 *
 * Point prototype
 *
 */
function Point(x, y)
{
    if (typeof x != "number")
        x = 0
    if (typeof y != "number")
        y = 0
    this.x = x
    this.y = y
}

Point.prototype.toString = function() { return "Point(" + this.x + "," + this.y + ")" }
Point.prototype.normalized = function() {
    var l = Math.sqrt(this.x * this.x + this.y * this.y)
    return new Point(this.x / l, this.y / l)
}
Point.prototype.add = function(point) {
    this.x += point.x
    this.y += point.y
    return this
}
Point.prototype.scale = function(factor) {
    this.x *= factor
    this.y *= factor
    return this
}

/**********************************************************************
 *
 * PointSet prototype
 *
 */

function PointSet()
{
    this.points = []
}

PointSet.prototype.append = function(x, y)
{
    if (typeof x != "number")
        throw "'x' is not a number"
    if (typeof y != "number")
        throw "'y' is not a number"
    this.points.push(new Point(x, y))
}

PointSet.prototype.size = function() { return this.points.length }
PointSet.prototype.at = function(i) { return this.points[i] }
PointSet.prototype.tangent = function(i) {
    function tangent2(a, b) {
        var dx = b.x - a.x
        var dy = b.y - a.y
        return new Point(dy, -dx).normalized()
    }

    if (i == 0)
        return tangent2(this.at(0), this.at(1))
    else if (i == this.size() - 1)
        return tangent2(this.at(i-1), this.at(i))
    else {
        var t1 = tangent2(this.at(i-1), this.at(i))
        var t2 = tangent2(this.at(i), this.at(i+1))
        return new Point((t1.x + t2.x) / 2, (t1.y + t2.y) / 2).normalized()
    }

}

/**********************************************************************
 *
 * Triangle prototype
 *
 */

function Triangle(a, b, c)
{
    this.a = new Point(a.x, a.y)
    this.b = new Point(b.x, b.y)
    this.c = new Point(c.x, c.y)
}

Triangle.prototype.shrinkBy = function(pixels) {
    var cx = (this.a.x + this.b.x + this.c.x) / 3
    var cy = (this.a.y + this.b.y + this.c.y) / 3

    var da = new Point(cx - this.a.x, cy - this.a.y).normalized().scale(pixels)
    var db = new Point(cx - this.b.x, cy - this.b.y).normalized().scale(pixels)
    var dc = new Point(cx - this.c.x, cy - this.c.y).normalized().scale(pixels)

    this.a.add(da)
    this.b.add(db)
    this.c.add(dc)
}

/**********************************************************************
 *
 * TriangleSet prototype
 *
 */

function TriangleSet()
{
    this.triangles = []
}
TriangleSet.prototype.append = function(a, b, c) { this.triangles.push(new Triangle(a, b, c)) }
TriangleSet.prototype.size = function() { return this.triangles.length }
TriangleSet.prototype.at = function(i) { return this.triangles[i] }
TriangleSet.prototype.shrinkBy = function(pixels) {
    for (var i=0; i<this.size(); ++i)
        this.at(i).shrinkBy(pixels)
}

/**********************************************************************
 *
 * Utility Functions
 *
 */

/**********************************************************************
 *
 * drawPolyline(ctx, pts)
 *
 * Draws a polyline using the current strokeStyle of the context.
 *    'ctx'     - the Context2D object
 *    'pts'     - a PointSet instance defining the points
 */

function drawPolyline(ctx, pts)
{
    if (pts.size() < 2)
        throw "Pointset contains no lines, " + pts.size() + " points total..."

    ctx.beginPath()
    for (var i=0; i<pts.size(); ++i) {
        var pt = pts.points[i]
        if (i == 0)
            ctx.moveTo(pt.x, pt.y)
        else
            ctx.lineTo(pt.x, pt.y)
    }
    ctx.stroke()
}

/**********************************************************************
 *
 * drawTriangle(ctx, a, b, c)
 *
 * Draws a triangle using ctx and its current fillStyle
 *    'ctx'     - the Context2D object
 *    'a'       - first point in the triangle
 *    'b'       - second point in the triangle
 *    'c'       - third point in the triangle
 */

function drawTriangle(ctx, triangle, offset)
{
    ctx.beginPath()
    ctx.moveTo(triangle.a.x, triangle.a.y)
    ctx.lineTo(triangle.b.x, triangle.b.y)
    ctx.lineTo(triangle.c.x, triangle.c.y)
    ctx.fill()

    var random = Math.sin(offset * 1451331.814145) / 2 + 0.5;
    ctx.fillStyle = Qt.hsla(0.15, 1, .5, random * 0.25)
    ctx.fill();
}


var ELLIPSE_PADDING = 0.03
var HORIZONTAL_SIZE = 0.55
var VERTICAL_SIZE = 0.65
var C_ANGLE_START = Math.PI / 4
var C_ANGLE_STOP = Math.PI * 2 - Math.PI / 4
var C_SEGMENT_COUNT = 9

var C_STROKE_WIDTH = 0.06;
var TRIANGLE_OUTLINE_WIDTH = 0.006

function buildPointSet(w, h)
{
    var centerX = w / 2
    var centerY = h / 2
    var widthC = w * HORIZONTAL_SIZE
    var heightC = h * VERTICAL_SIZE
    var pts = new PointSet();
    for (var i=0; i<C_SEGMENT_COUNT; ++i) {
        var angle = C_ANGLE_START + i * (C_ANGLE_STOP - C_ANGLE_START) / (C_SEGMENT_COUNT - 1)
        var x = centerX + widthC * Math.cos(angle) / 2
        var y = centerY - heightC * Math.sin(angle) / 2
        pts.append(x, y)
    }

    return pts;
}

function createStrokePoints(pts, strokeWidth)
{
    var strokePoints = new PointSet()

    for (var i=0; i<pts.size(); ++i) {
        var p = pts.at(i)
        var t = pts.tangent(i)
        strokePoints.append(p.x + t.x * strokeWidth, p.y + t.y * strokeWidth)
        strokePoints.append(p.x - t.x * strokeWidth, p.y - t.y * strokeWidth)
    }
    return strokePoints
}

function createTrianglesFromStroke(strokePoints)
{
    var triangles = new TriangleSet()
    for (var i=0; i<strokePoints.size() - 2; ++i) {
        // will result in alternate directional triangles, but that shouldn't make
        // much of a difference...
        triangles.append(strokePoints.at(i),
                         strokePoints.at(i+1),
                         strokePoints.at(i+2))
    }
    return triangles
}


function drawLogo(ctx, w, h)
{
    var baseSize = Math.min(w, h)

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, w, h)

    var fillColor = "black"
    var triangleColor = "crimson"

    ctx.save();

    ctx.fillStyle = fillColor
    ctx.fillRect(baseSize * ELLIPSE_PADDING, baseSize * ELLIPSE_PADDING, w - baseSize * ELLIPSE_PADDING * 2, h - baseSize * ELLIPSE_PADDING * 2)
    // ctx.beginPath()
    // ctx.ellipse(baseSize * ELLIPSE_PADDING, baseSize * ELLIPSE_PADDING, w - baseSize * ELLIPSE_PADDING * 2, h - baseSize * ELLIPSE_PADDING * 2)
    // ctx.fill()

    var pts = buildPointSet(w, h)
    // ctx.strokeStyle = "black"
    // drawPolyline(ctx, pts)

    var strokePoints = createStrokePoints(pts, Math.min(w, h) * C_STROKE_WIDTH)
    var tris = createTrianglesFromStroke(strokePoints)

    ctx.globalCompositeMode = "lighter"
    ctx.translate(0.05 * w, 0)

    for (var i=0; i<tris.size(); ++i) {
        ctx.fillStyle = triangleColor
        drawTriangle(ctx, tris.at(i), i)
    }

    ctx.globalCompositeMode = "source-over"
    ctx.strokeStyle = fillColor
    ctx.lineWidth = TRIANGLE_OUTLINE_WIDTH * baseSize
    drawPolyline(ctx, strokePoints)

    ctx.restore()
}