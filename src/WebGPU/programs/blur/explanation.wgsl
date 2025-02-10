struct Params {
  filterDim : i32, // Size of the blur filter (e.g., 15 for a 15x15 filter)
  blockDim : u32,  // Dimensions of a compute workgroup along one axis
}

@group(0) @binding(0) var samp : sampler; // Sampler to use for texture lookups
@group(0) @binding(1) var<uniform> params : Params; // Uniform buffer holding blur parameters

@group(1) @binding(1) var inputTex : texture_2d<f32>; // Input texture 
@group(1) @binding(2) var outputTex : texture_storage_2d<rgba8unorm, write>; // Output texture (write-only)

struct Flip {
  value : u32, // Flag to indicate if dimensions should be flipped
}
@group(1) @binding(3) var<uniform> flip : Flip; 

var<workgroup> tile : array<array<vec3<f32>, 128>, 4>; // Workgroup memory to store a block of the image 

@compute @workgroup_size(32, 1, 1) // Workgroup size: 32 threads along x-axis
fn main(
  @builtin(workgroup_id) WorkGroupID : vec3<u32>, // Index of the current workgroup
  @builtin(local_invocation_id) LocalInvocationID : vec3<u32> // Index of the thread within the workgroup
) {
  let filterOffset = (params.filterDim - 1) / 2; // Offset to center of blur filter
  let dims = vec2<i32>(textureDimensions(inputTex, 0)); // Dimensions of the input texture

  // Calculate starting texture coordinate for this workgroup
  let baseIndex = vec2<i32>(WorkGroupID.xy * vec2(params.blockDim, 4) + 
                            LocalInvocationID.xy * vec2(4, 1)) - vec2(filterOffset, 0);
  /*
  increasing WorkGroupID changes x by 114, and y by 4
  increasing LocalInvocationID changes x by 4, y stays the same
  */

  // Load a 4x4 block of pixels from the input texture
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var loadIndex = baseIndex + vec2(c, r);
      if (flip.value != 0) { // no flipping (flip.value == 0):
        loadIndex = loadIndex.yx; // Flip x and y if the 'flip' flag is set
      }

      tile[r][4 * LocalInvocationID.x + u32(c)] = textureSampleLevel(
        inputTex,
        samp,
        (vec2<f32>(loadIndex) + vec2<f32>(0.25, 0.25)) / vec2<f32>(dims), // Sample with slight offset
        0.0 // Use mipmap level 0
      ).rgb;
    }
  }

  workgroupBarrier(); // Ensure all threads have loaded data before proceeding

  // Perform the blur calculation
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var writeIndex = baseIndex + vec2(c, r);
      if (flip.value != 0) {
        writeIndex = writeIndex.yx; // Flip x and y if necessary
      }

      let center = i32(4 * LocalInvocationID.x) + c; 
      // center just foes from 0..128
      // filterOffset = 7
      
      // this if makes sure you have enough neighbours before and after(NOT AROUND)
      if (center >= filterOffset && center < 128 - filterOffset && all(writeIndex < dims)) {
        var acc = vec3(0.0, 0.0, 0.0);
        for (var f = 0; f < params.filterDim; f++) {
          var i = center + f - filterOffset; // goes <center - 7 .. center + 7>
          acc += (1.0 / f32(params.filterDim)) * tile[r][i]; // Accumulate weighted samples 
          // so it stores blur only made in one direction
        }
        textureStore(outputTex, writeIndex, vec4(acc, 1.0)); // Store blurred result
      }
    }
  }
}


/*
I think we can optimize it by using samplers way more!
Firstly we can read the middle of four pixels, 
or can we just try to make this texture small and try to expand it????
*/
