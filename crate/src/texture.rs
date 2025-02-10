use serde::{Deserialize, Serialize};
use wasm_bindgen::convert::FromWasmAbi;

use crate::Point;

#[derive(Serialize, Deserialize)]
pub struct VertexPoint {
    x: f32,
    y: f32,
    u: f32,
    v: f32,
}

pub struct Texture {
    points: Vec<VertexPoint>,
    pub id: usize,
}

impl Texture {
    pub fn new(points: Vec<VertexPoint>, id: usize) -> Texture {
        Texture { points, id }
    }

    pub fn add_vertex(&self, verticies: &mut Vec<f32>) {
        let points: [&VertexPoint; 6] = [
            &self.points[0],
            &self.points[1],
            &self.points[2],
            &self.points[2],
            &self.points[3],
            &self.points[0],
        ];
        points.iter().for_each(|point| {
            verticies.push(point.x);
            verticies.push(point.y);
            verticies.push(0.0);
            verticies.push(1.0);
            verticies.push(point.u);
            verticies.push(point.v);
        });
    }

    pub fn update_coords(&mut self, new_points: Vec<Point>) {
        self.points
            .iter_mut()
            .enumerate()
            .for_each(|(index, point)| {
                point.x = new_points[index].x;
                point.y = new_points[index].y;
            });
    }
}
