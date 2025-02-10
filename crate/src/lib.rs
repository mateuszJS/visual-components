extern crate js_sys;
extern crate serde_wasm_bindgen;
extern crate wasm_bindgen;
extern crate web_sys;

#[macro_use]
extern crate lazy_static;

macro_rules! log {
  ($( $t:tt )*) => (web_sys::console::log_1(&format!($($t)*).into()));
}

macro_rules! err {
  ($( $t:tt )*) => (web_sys::console::error_1(&format!($($t)*).into()); panic!(""));
  // there is no way to specify panci message, so we need to do console.error and then panci any value
}

//to remove and replace with util
macro_rules! angle_diff {
  ($beta:expr, $alpha:expr) => {{
    let phi = ($beta - $alpha).abs() % (2.0 * MATH_PI); // This is either the distance or 2*Math.PI - distance
    if phi > MATH_PI {
      (2.0 * MATH_PI) - phi
    } else {
      phi
    }
  }}
}

mod texture;

use gloo_utils::format::JsValueSerdeExt; // for transforming JsValue into serde
use serde::{Deserialize, Serialize};
use texture::{Texture, VertexPoint};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct State {
    textures: Vec<Texture>,
}

#[wasm_bindgen]
impl State {
    pub fn new(width: f32, height: f32) -> State {
        State { textures: vec![] }
    }

    pub fn add_texture(&mut self, raw_points: JsValue, id: usize) {
        let serde = raw_points.into_serde();
        let points: Vec<VertexPoint> = if serde.is_ok() {
            serde.unwrap()
        } else {
            err!("add_texture received not copatible data from JS. Failed at conversion to Rust types.");
        };

        self.textures.push(Texture::new(points, id));
    }

    pub fn get_shader_input(&self, index: usize) -> JsValue {
        let mut vertex_data: Vec<f32> = vec![];
        let mut texture_id: usize = 0;
        if index < self.textures.len() {
            texture_id = self.textures[index].id;
            self.textures[index].add_vertex(&mut vertex_data);
        }

        let payload = ShaderInput {
            texture_id,
            vertex_data,
        };
        serde_wasm_bindgen::to_value(&payload).unwrap()

        // js_sys::Float32Array::from(&result[..])
    }

    pub fn update_points(&mut self, texture_id: usize, raw_points: JsValue) {
        let serde = raw_points.into_serde();
        let points: Vec<Point> = if serde.is_ok() {
            serde.unwrap()
        } else {
            err!("add_texture received not copatible data from JS. Failed at conversion to Rust types.");
        };

        let texture_option = self
            .textures
            .iter_mut()
            .find(|texture| texture.id == texture_id);

        texture_option.unwrap().update_coords(points);
    }
}

#[derive(Serialize, Deserialize)]
struct Point {
    x: f32,
    y: f32,
}

#[derive(Serialize, Deserialize)]
struct ShaderInput {
    texture_id: usize,
    vertex_data: Vec<f32>,
}
