struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
    @location(3) tangent : vec3<f32>,
    @location(4) joints: vec4<u32>, //optional
    @location(5) weights: vec4<f32>, //optional
}

struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
}

struct CameraUniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
    position: vec3f,
}

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat3x3f,
}

struct MaterialUniforms {
    baseFactor: vec4f,
    reflectance: f32,
    transmittance: f32,
    ior: f32,
    effect: f32,
}

struct LightUniforms {
    color: vec3f,
    intensity: f32,
    direction: vec3f,
    _pad: f32,
}

//skin uniform array (max 100 bones)
struct SkinUniforms {
    joints : array<mat4x4<f32>, 100>
}


//group 0
@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<uniform> light: LightUniforms;   

//group 1
@group(1) @binding(0) var<uniform> model: ModelUniforms;
@group(1) @binding(1) var<uniform> skin : SkinUniforms;

//group 2
@group(2) @binding(0) var<uniform> material: MaterialUniforms;
@group(2) @binding(1) var uBaseTexture: texture_2d<f32>;
@group(2) @binding(2) var uBaseSampler: sampler;

//group 3
@group(3) @binding(0) var uEnvironmentTexture: texture_cube<f32>;
@group(3) @binding(1) var uEnvironmentSampler: sampler;
 


@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    var skinMatrix = mat4x4<f32>();
    let totalWeight = input.weights.x + input.weights.y + input.weights.z + input.weights.w;

    if (totalWeight > 0.0) {    //this check ensures static meshes still render even though they have no joints or weights
        for (var i: u32 = 0u; i < 4u; i = i + 1u) { //each vertex in skinned meshes is affected by 4 joints (by certain weight)
            skinMatrix += skin.joints[input.joints[i]] * input.weights[i];
        }
    } else {
        skinMatrix = model.modelMatrix;
    }


    let position = skinMatrix * vec4(input.position, 1.0);

    output.position = position.xyz;
    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * position;
    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;

    return output;
}

@fragment fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    
    let N = normalize(input.normal);
    let V = normalize(camera.position - input.position); 
    let R = reflect(-V, N); 
    let T = refract(-V, N, material.ior); 

    let baseColor = textureSample(uBaseTexture, uBaseSampler, input.texcoords);
    let reflectedColor = textureSample(uEnvironmentTexture, uEnvironmentSampler, R);
    let refractedColor = textureSample(uEnvironmentTexture, uEnvironmentSampler, T);
    let reflection = mix(baseColor, reflectedColor, material.reflectance);
    let refraction = mix(baseColor, refractedColor, material.transmittance);

    let L = normalize(-light.direction);
    let diff = max(dot(N, L), 0.0);
    let diffuse = baseColor.rgb * light.color * diff * light.intensity;

    let H = normalize(L + V);;
    let spec = pow(max(dot(N, H), 0.0), 64.0);
    let specular = light.color * spec * light.intensity * 0.5;

    let envMix = mix(reflection, refraction, material.effect);
    let finalColor = envMix.rgb * 0.5 + diffuse + specular;
    
    output.color = vec4(pow(finalColor, vec3(1 / 2.2)), baseColor.a);
    
    return output; 
}