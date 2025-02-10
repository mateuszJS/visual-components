/*
to do bench you have to
1. remove cdylib from crate-type (Cargo.toml) and use rlib to link you lib.rs package
2. install nightly to support test feature "rustup install nightly"
3. set nightly as default compiler "rustup default nightly", to revert it use "rustup default stable"
4. call "cargo bench"
*/

#![feature(test)]

extern crate Battle;
extern crate test;

use test::Bencher;

#[bench]
fn find_path_with_clone(b: &mut Bencher) {
    Battle::position_utils::map_terrain::ObstaclesLazyStatics::init_and_get_obstacles_handler(
        Some(vec![
            600.0, 100.0, 900.0, 100.0, 900.0, 300.0, 600.0, 300.0, // end here
            700.0, 400.0, 900.0, 400.0, 900.0, 600.0, 700.0, 600.0, 600.0, 500.0,
        ]),
    );
    // let n = test::black_box(1000);
    Battle::position_utils::PositionUtils::get_track(100.0, 100.0, 950.0, 450.0);
    b.iter(|| {
        Battle::position_utils::PositionUtils::get_track(100.0, 100.0, 950.0, 450.0);
    });
}
