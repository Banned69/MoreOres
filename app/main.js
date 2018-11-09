const ORE_SPRITE = s( '.ore-sprite' )
const RIGHT_CONTAINER = s( '.right-container' )
const INVENTORY_EL = s( '.topbar-inventory' )
const ORE_WEAK_SPOT_CONTAINER = s( '.ore-weak-spot-container' )
const ORE_WEAK_SPOT = s( '.ore-weak-spot' )
const LEFT_VERTICAL_SEPARATOR = s( '.left-vertical-separator' )
const MIDDLE_VERTICAL_SEPARATOR = s( '.middle-vertical-separator' )
const RIGHT_VERTICAL_SEPARATOR = s( '.right-vertical-separator' )
const TORCH_LEFT = s( '.torch-left' )
const TORCH_RIGHT = s( '.torch-right' )
const TAB_CONTENT = s( '.tab-content' )
const TEXT_SCROLLER_CONTAINER = s( '.text-scroller-container' )
const TOOLTIP = s( '.tooltip' )

let S = new State().state
let SFX = new SoundEngine()
let RN = new RisingNumber()
let TS = new TextScroller()
let TT = new Tooltip()
let PE = new ParticleEngine()

let earn = ( amount ) => {
  update_ore_hp( amount )

  S.stats.total_ores_earned += amount
  S.ores += amount
}

let spend = ( amount ) => {
  S.ores -= amount
  SFX.buy_sound.play()
}

let reposition_elements = () => {
  let left_vertical_separator_coords = LEFT_VERTICAL_SEPARATOR.getBoundingClientRect()
  let middle_vertical_separator_coords = MIDDLE_VERTICAL_SEPARATOR.getBoundingClientRect()
  let torch_coords = TORCH_LEFT.getBoundingClientRect()

  // Position torches to the separators
  TORCH_LEFT.style.left = left_vertical_separator_coords.right + 'px'
  TORCH_RIGHT.style.left = middle_vertical_separator_coords.left - torch_coords.width + 'px'

}

let build_store = () => {
  let str = ``
  index = 0
  str += build_upgrades()
  str += build_buildings()

  TAB_CONTENT.innerHTML = str
}

let build_upgrades = () => {
  let str = '<div class="upgrades-container">'
  let index = 0
  Upgrades.forEach( upgrade => {
    if ( upgrade.hidden == 0 && !upgrade.owned ) {
      str += `
        <div class='upgrade' onclick="Upgrades[ ${ index } ].buy( event )" onmouseover="SFX.store_item_hover.play(); TT.show( event, { name: '${ upgrade.code_name }', type: 'upgrade' } )" onmouseout="TT.hide()">

        </div>
      `
    }
    
    index++
  })

  str += '</div>'

  return str
}

let build_buildings = () => {
  let str = ''
  let index = 0
  Buildings.forEach( building => {
    if ( building.hidden == 0 ) {
      str += `
        <div class="building" onclick="Buildings[ ${ index } ].buy( event )" onmouseover="SFX.store_item_hover.play(); TT.show( event, { name: '${ building.code_name }', type: 'building' } )" onmouseout="TT.hide()">
          <div class="left">
            <img src="${ building.img }" alt="building image"/>
          </div>
          <div class="middle">
            <h1>${ building.name }</h1>
            <p>Cost: ${ beautify_number( building.current_price ) } ores</p>
          </div>
          <div class="right">
            <h1>${ building.owned }</h1>
          </div>
        </div>
      `
    } else if ( building.hidden == 1 ) {
      str += `
        <div class="building hidden"">
          <div class="left">
            <img src="${ building.img }" alt="building image"/>
          </div>
          <div class="middle">
            <h1>???</h1>
            <p>Cost: ??? ores</p>
          </div>
        </div>
      `
    }

    index++
  })

  return str
}

let calculate_opc = ( type ) => {
  let opc = S.opc

  if ( type ) {
    if ( type == 'weak-spot' ) {
      opc *= S.weak_hit_multi
    }
  }

  return opc
}

let calculate_ops = () => {
  let ops = 0

  Buildings.forEach( building => {
    ops += building.owned * building.production
  })

  S.ops = ops
}

let calculate_building_ops = ( building_owned, building_production ) => {
  let percentage = ( ( building_owned * building_production ) / S.ops ) * 100
  return beautify_number( percentage )
}

let init_game = () => {
  start_loop()
  generate_weak_spot()
  reposition_elements()
  build_store()
  handle_text_scroller()
  ORE_SPRITE.addEventListener( 'click', handle_click )
  ORE_WEAK_SPOT.addEventListener( 'click', ( e ) => { handle_click( e, 'weak-spot' ) })
}

let generate_weak_spot = () => {

  let ore_sprite_coords = ORE_SPRITE.getBoundingClientRect()

  // POSITION CONTAINER AROUND ORE SPRITE
  ORE_WEAK_SPOT_CONTAINER.style.position = 'absolute'
  ORE_WEAK_SPOT_CONTAINER.style.width = ore_sprite_coords.width + 'px'
  ORE_WEAK_SPOT_CONTAINER.style.height = ore_sprite_coords.height + 'px'
  ORE_WEAK_SPOT_CONTAINER.style.bottom = 0

  // PICK RANDOM COORDS FOR WEAK SPOT
  let ore_weak_spot_container_coords = ORE_WEAK_SPOT_CONTAINER.getBoundingClientRect()

  let x = get_random_num( 0, ( ore_weak_spot_container_coords.right - ore_weak_spot_container_coords.left ) )
  let y = get_random_num( 0, ( ore_weak_spot_container_coords.bottom - ore_weak_spot_container_coords.top ) )

  ORE_WEAK_SPOT.style.left = x + 'px'
  ORE_WEAK_SPOT.style.top = y + 'px'

}

let handle_click = ( e, type ) => {

  let opc = calculate_opc( type )

  if ( type ) {
    SFX.ore_weak_spot_hit_sfx.play()
    S.stats.total_weak_hit_clicks++
    S.current_combo++
    if ( S.current_combo > S.stats.highest_combo ) S.stats.highest_combo = S.current_combo
    if ( S.current_combo % 5 == 0 ) RN.new( e, 'combo', S.current_combo )
    RN.new( event, 'weak-hit-click', opc )
    generate_weak_spot()
  } else {
    SFX.ore_hit_sfx.play()
    S.current_combo = 0
    RN.new( event, 'click', opc )
    // PE.generate_rock_particles( e )
  }

  S.stats.total_clicks++

  earn( opc )
}

let handle_text_scroller = () => {

  let animation_speed = 20

  setTimeout( () => {  handle_text_scroller()  }, 1000 * animation_speed )

  if ( Math.random() <= .40 || TS.queue.length > 0 && !S.prefs.window_blurred ) {
    let text = TS.get()
    let text_scroller = document.createElement( 'div' )
    text_scroller.innerHTML = text
    text_scroller.style.transition = `transform ${ animation_speed }s linear`
    text_scroller.classList.add( 'text-scroller' )

    TEXT_SCROLLER_CONTAINER.append( text_scroller )

    let text_scroller_dimensions = text_scroller.getBoundingClientRect()
    let text_scroller_container_dimensions = TEXT_SCROLLER_CONTAINER.getBoundingClientRect()

    text_scroller.style.left = text_scroller_container_dimensions.right + 'px'
    text_scroller.style.transform = `translateX( -${ text_scroller_container_dimensions.width + text_scroller_dimensions.width + 100 }px )`

    text_scroller.addEventListener( 'transitionend', () => {  remove_el( text_scroller )  } )
  }
}

let start_loop = () => {

  setInterval(() => {
    update_topbar_inventory()
    update_ore_sprite()
    earn( S.ops / S.prefs.game_speed )
  }, 1000 / S.prefs.game_speed)

  setInterval(() => {
    if ( S.ops > 0 && S.prefs.show_ops_rising_numbers ) {
      RN.new( null, 'buildings', S.ops )
    }
  }, 1000)
}

let update_ore_hp = ( amount ) => {
  if (S.current_ore_hp - amount <= 0 ) {
    SFX.ore_destroyed_sfx.play()
    S.stats.current_rocks_destroyed += 1
    S.stats.total_rocks_destroyed += 1
    S.current_ore_max_hp *= 1.5
    S.current_ore_hp = S.current_ore_max_hp
    current_sprite = 0
  } else {
    S.current_ore_hp -= amount
  }
}

let current_sprite = 0
let update_ore_sprite = () => {
  let current_percentage = S.current_ore_hp / S.current_ore_max_hp * 100

  if ( current_percentage <= 100 && current_percentage > 80 && current_sprite != 1 ) {
    ORE_SPRITE.src = '/assets/images/ore1-1.png'
    current_sprite = 1
  } else if ( current_percentage <= 80 && current_percentage > 60 && current_sprite != 2 ) {
    SFX.ore_percentage_lost_sfx.play()
    ORE_SPRITE.src = '/assets/images/ore1-2.png'
    current_sprite = 2
  } else if ( current_percentage <= 60 && current_percentage > 40 && current_sprite != 3 ) {
    SFX.ore_percentage_lost_sfx.play()
    ORE_SPRITE.src = '/assets/images/ore1-3.png'
    current_sprite = 3
  } else if ( current_percentage <= 40 && current_percentage > 20 && current_sprite != 4 ) {
    SFX.ore_percentage_lost_sfx.play()
    ORE_SPRITE.src = '/assets/images/ore1-4.png'
    current_sprite = 4
  } else if ( current_percentage <= 20 && current_sprite != 5 ) {
    SFX.ore_percentage_lost_sfx.play()
    ORE_SPRITE.src = '/assets/images/ore1-5.png'
    current_sprite = 5
  }

}

let update_topbar_inventory = () => {
  let str = `
    <div class='left'>
      <p>Ores: ${ beautify_number( S.ores ) }` 

      if ( S.ops > 0 ) str += ` (${ beautify_number( S.ops )}/s)`
      
      str += `</p>`

      if ( S.stats.total_gems_earned > 0 ) {
        str += `<p>Gems: ${ beautify_number( S.gems ) }</p>`
      }

      str += `
    </div>
    <div class='right'>
      <p>Generation: ${ S.generation }</p>
    </div>
  `

  INVENTORY_EL.innerHTML = str
}

window.onload = () => { init_game() }
window.onresize = () => { reposition_elements() }
window.onblur = () => { S.prefs.window_blurred = true }
window.onfocus = () => { S.prefs.window_blurred = false }