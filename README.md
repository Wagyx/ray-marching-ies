# ray-marching-ies
A ray marcher to demonstrate an IES point light source in a Cornell Box.
You can use it with your own IES file.

The IES file format describes the angular distribution of intensity of a point light source following the [IESNA LM-63 format](https://documents.pub/document/ies-specification-lm-63-2002.html?page=1).


You may find an [online version](https://asliceofcuriosity.fr/assets/ray-marching-ies/webgl_raymarching_ies.html) for this application and [another application](https://asliceofcuriosity.fr/assets/rayset-viewer/index-intensity.html) to visualize the distribution itself.

Beware, type A and B are not supported and some type C files won't load if they don't follow the specifications

There exist other light formats such as EULUMDAT, CIBSE that are not handled by this viewer. Please find a way to convert to IES with a third party software,or contribute with your own Javascript Loader.

## Resources
This viewer was made with [three.js](https://threejs.org) and was inspired by [webgpu_lights_ies_spotlight](https://threejs.org/examples/?q=ies#webgpu_lights_ies_spotlight) and [webgl_raymarching_reflect](https://threejs.org/examples/?q=march#webgl_raymarching_reflect).

You may download IES files through this [libray](https://ieslibrary.com/) of IES files or from a [light manufacturer](https://www.osram.com/apps/downloadcenter/os/?path=%2Fos-files%2FOptical+Simulation%2FLED%2F).



## Shadertoy
If you are interested in IES lights made from different light source shapes, I have made a bunch of shaders on [shadertoy](https://www.shadertoy.com).
- [Light Intensity - Cornell Box](https://www.shadertoy.com/view/DlXGzX)
- [Light Intensity - Function 3D](https://www.shadertoy.com/view/3s3fDj)
- [Lambertian IES light intensity](https://www.shadertoy.com/view/3dGyDw)