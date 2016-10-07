import QtQuick 2.2

import "draw.js" as Logo

Canvas
{
    width: 800
    height: 480

    onPaint: {
        var ctx = getContext("2d");

        ctx.fillStyle = Qt.hsla(0, 0.0, 0.5)
        ctx.fillRect(0, 0, width, height)

        ctx.save()
        ctx.translate(10, 10)

        // try {
        Logo.drawLogo(ctx, 200, 200)
        // } catch (e) {
        //     print("Caught Exception,", e);
        // }

        ctx.restore()

        ctx.save()
        ctx.translate(30, 250)
        Logo.drawLogo(ctx, 64, 64);
        ctx.restore();
    }

}