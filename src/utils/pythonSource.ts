export const PYTHON_SPACE_SHOOTER_SOURCE = `import pygame
import random
import math

# Initialize game
pygame.init()

# Screen settings
WIDTH, HEIGHT = 400, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Space Shooter")

# Colors
WHITE = (255, 255, 255)
RED = (255, 50, 50)
PURPLE = (138, 43, 226)
DARK_BG = (8, 4, 20)
NEON_PINK = (255, 90, 160)
NEON_BLUE = (180, 160, 255)
HEART_COLOR = (190, 50, 230)

clock = pygame.time.Clock()
FPS = 60

font_ui = pygame.font.SysFont("consolas", 18, bold=True)
font_big = pygame.font.SysFont("consolas", 36, bold=True)
font_small = pygame.font.SysFont("consolas", 16)


def create_background():
    """Tạo nền vũ trụ tĩnh với các hành tinh tím phát sáng."""
    bg = pygame.Surface((WIDTH, HEIGHT))
    bg.fill(DARK_BG)

    nebula = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    pygame.draw.circle(nebula, (70, 15, 130, 45), (40, 280), 200)
    pygame.draw.circle(nebula, (100, 25, 170, 35), (340, 140), 140)
    bg.blit(nebula, (0, 0))

    planet_left = pygame.Surface((260, 260), pygame.SRCALPHA)
    pygame.draw.circle(planet_left, (138, 43, 226, 40), (90, 130), 125)
    pygame.draw.circle(planet_left, (45, 12, 85, 255), (85, 130), 115)
    pygame.draw.circle(planet_left, (22, 6, 45, 255), (70, 135), 108)
    pygame.draw.arc(planet_left, (180, 90, 255, 140), (-30, 15, 230, 230), -1.1, 1.1, 3)
    bg.blit(planet_left, (-35, 155))

    planet_right = pygame.Surface((90, 90), pygame.SRCALPHA)
    pygame.draw.circle(planet_right, (138, 43, 226, 45), (45, 45), 36)
    pygame.draw.circle(planet_right, (28, 10, 55, 255), (45, 45), 30)
    pygame.draw.circle(planet_right, (15, 5, 30, 255), (40, 48), 26)
    bg.blit(planet_right, (305, 195))

    return bg


def draw_heart(surface, x, y, size=9, color=HEART_COLOR):
    glow = pygame.Surface((size * 4, size * 4), pygame.SRCALPHA)
    cx, cy = size * 2, size * 2
    r = size // 2 + 1

    pygame.draw.circle(glow, (*color, 70), (cx - r + 1, cy - 2), r + 3)
    pygame.draw.circle(glow, (*color, 70), (cx + r - 1, cy - 2), r + 3)

    pygame.draw.circle(glow, (*color, 255), (cx - r + 1, cy - 2), r)
    pygame.draw.circle(glow, (*color, 255), (cx + r - 1, cy - 2), r)
    points = [
        (cx - size, cy - 1),
        (cx + size, cy - 1),
        (cx, cy + size + 1)
    ]
    pygame.draw.polygon(glow, (*color, 255), points)
    surface.blit(glow, (x - cx, y - cy))


class Asteroid:
    def __init__(self):
        self.x = random.randint(0, WIDTH)
        self.y = random.randint(-50, HEIGHT)
        self.speed = random.uniform(0.3, 0.9)
        self.radius = random.randint(12, 28)
        num_pts = random.randint(6, 9)
        self.offsets = [
            (
                math.cos(2 * math.pi * i / num_pts) * self.radius * random.uniform(0.7, 1.15),
                math.sin(2 * math.pi * i / num_pts) * self.radius * random.uniform(0.7, 1.15),
            )
            for i in range(num_pts)
        ]

    def update(self):
        self.y += self.speed
        if self.y - self.radius > HEIGHT:
            self.y = -self.radius - 10
            self.x = random.randint(0, WIDTH)

    def draw(self, surface):
        pts = [(self.x + ox, self.y + oy) for ox, oy in self.offsets]
        pygame.draw.polygon(surface, (20, 10, 40), pts)
        pygame.draw.polygon(surface, (110, 50, 180), pts, 2)


class Particle:
    def __init__(self, x, y, color=RED, speed_range=(1.5, 5.5), life=25, radius=3):
        angle = random.uniform(0, math.pi * 2)
        speed = random.uniform(*speed_range)
        self.x = x
        self.y = y
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.life = life
        self.max_life = life
        self.color = color
        self.radius = radius

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vx *= 0.95
        self.vy *= 0.95
        self.life -= 1

    def draw(self, glow_surf):
        if self.life <= 0:
            return
        alpha = int(255 * (self.life / self.max_life))
        r = max(1, int(self.radius * (self.life / self.max_life)))
        pygame.draw.circle(glow_surf, (*self.color, alpha // 2), (int(self.x), int(self.y)), r + 3)
        pygame.draw.circle(glow_surf, (255, 220, 220, alpha), (int(self.x), int(self.y)), r)


class Bullet:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.speed = 9

    def update(self):
        self.y -= self.speed

    def draw(self, surface, glow_surf):
        pygame.draw.line(glow_surf, (138, 43, 226, 150), (self.x, self.y), (self.x, self.y + 16), 8)
        pygame.draw.line(glow_surf, (200, 160, 255, 210), (self.x, self.y), (self.x, self.y + 14), 5)
        pygame.draw.line(surface, WHITE, (self.x, self.y + 1), (self.x, self.y + 13), 2)


class Enemy:
    def __init__(self, score):
        self.size = 15
        self.mode = random.choice(["straight", "straight", "angled"])
        if self.mode == "straight":
            self.x = random.randint(30, WIDTH - 30)
            self.y = -25
            self.vx = random.uniform(-0.4, 0.4)
            self.vy = random.uniform(2.0, 3.2) + min(score * 0.03, 2.0)
        else:
            side = random.choice([-1, 1])
            self.x = WIDTH // 2 + side * random.randint(80, 170)
            self.y = -25
            self.vx = -side * random.uniform(1.0, 2.0)
            self.vy = random.uniform(2.2, 3.3) + min(score * 0.03, 2.0)

        self.trail_timer = 0

    def update(self, trails):
        self.x += self.vx
        self.y += self.vy

        if self.x < 22 or self.x > WIDTH - 22:
            self.vx *= -1

        self.trail_timer += 1
        if self.trail_timer % 3 == 0:
            trails.append(
                Particle(
                    self.x + random.uniform(-2, 2),
                    self.y - 10,
                    color=RED,
                    speed_range=(0.1, 0.5),
                    life=14,
                    radius=2,
                )
            )

    def get_points(self):
        angle = math.atan2(self.vy, self.vx)
        pts = []
        offsets = [0, 2.35, -2.35]
        radii = [self.size + 2, self.size, self.size]
        for off, rad in zip(offsets, radii):
            px = self.x + math.cos(angle + off) * rad
            py = self.y + math.sin(angle + off) * rad
            pts.append((px, py))
        return pts

    def draw(self, surface, glow_surf):
        pts = self.get_points()
        pygame.draw.polygon(glow_surf, (255, 30, 50, 90), pts, 7)
        pygame.draw.polygon(glow_surf, (255, 70, 90, 180), pts, 4)
        pygame.draw.polygon(surface, (255, 170, 180), pts, 2)


class Player:
    def __init__(self):
        self.x = WIDTH // 2
        self.y = HEIGHT - 68
        self.speed = 5
        self.cooldown = 0
        self.invincible = 0

    def update(self, keys):
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.x -= self.speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.x += self.speed
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.y -= self.speed * 0.8
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.y += self.speed * 0.8

        self.x = max(28, min(WIDTH - 28, self.x))
        self.y = max(HEIGHT // 2, min(HEIGHT - 40, self.y))

        if self.cooldown > 0:
            self.cooldown -= 1
        if self.invincible > 0:
            self.invincible -= 1

    def shoot(self, bullets, double_shot=False):
        if self.cooldown == 0:
            if double_shot:
                bullets.append(Bullet(self.x - 8, self.y - 22))
                bullets.append(Bullet(self.x + 8, self.y - 22))
            else:
                bullets.append(Bullet(self.x, self.y - 26))
            self.cooldown = 12

    def draw(self, surface, glow_surf):
        if self.invincible > 0 and (self.invincible // 4) % 2 == 0:
            return

        x, y = self.x, self.y
        hull = [(x, y - 24), (x - 10, y + 6), (x, y + 12), (x + 10, y + 6)]
        left_wing = [(x - 7, y - 4), (x - 20, y + 12), (x - 8, y + 9)]
        right_wing = [(x + 7, y - 4), (x + 20, y + 12), (x + 8, y + 9)]
        flame_len = random.randint(10, 17)
        flame = [(x - 4, y + 11), (x, y + 11 + flame_len), (x + 4, y + 11)]

        pygame.draw.polygon(glow_surf, (138, 43, 226, 130), hull, 7)
        pygame.draw.polygon(glow_surf, (138, 43, 226, 120), left_wing, 5)
        pygame.draw.polygon(glow_surf, (138, 43, 226, 120), right_wing, 5)
        pygame.draw.polygon(glow_surf, (180, 120, 255, 180), flame, 4)

        pygame.draw.polygon(surface, (25, 15, 50), hull)
        pygame.draw.polygon(surface, WHITE, hull, 2)
        pygame.draw.polygon(surface, (35, 20, 65), left_wing)
        pygame.draw.polygon(surface, NEON_BLUE, left_wing, 2)
        pygame.draw.polygon(surface, (35, 20, 65), right_wing)
        pygame.draw.polygon(surface, NEON_BLUE, right_wing, 2)
        pygame.draw.polygon(surface, WHITE, flame, 2)
        pygame.draw.circle(surface, NEON_BLUE, (int(x), int(y - 3)), 3)


def main():
    bg_surface = create_background()
    stars = [
        [random.randint(0, WIDTH), random.randint(0, HEIGHT), random.uniform(0.3, 1.2)]
        for _ in range(45)
    ]
    asteroids = [Asteroid() for _ in range(5)]

    def reset_game():
        return Player(), [], [], [], 0, 3, False, 0

    player, bullets, enemies, particles, score, lives, game_over, spawn_timer = reset_game()

    running = True
    while running:
        clock.tick(FPS)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and game_over:
                if event.key == pygame.K_r:
                    player, bullets, enemies, particles, score, lives, game_over, spawn_timer = reset_game()

        keys = pygame.key.get_pressed()

        if not game_over:
            player.update(keys)
            if keys[pygame.K_SPACE]:
                player.shoot(bullets, double_shot=(score >= 5))

            spawn_timer += 1
            spawn_rate = max(22, 48 - score // 2)
            if spawn_timer >= spawn_rate:
                enemies.append(Enemy(score))
                spawn_timer = 0

            for b in bullets[:]:
                b.update()
                if b.y < -20:
                    bullets.remove(b)

            for e in enemies[:]:
                e.update(particles)
                if e.y > HEIGHT + 30:
                    enemies.remove(e)
                    continue

                hit = False
                for b in bullets[:]:
                    if math.hypot(e.x - b.x, e.y - b.y) < e.size + 6:
                        bullets.remove(b)
                        enemies.remove(e)
                        score += 1
                        for _ in range(28):
                            particles.append(
                                Particle(e.x, e.y, color=random.choice([RED, NEON_PINK]), speed_range=(1.5, 6.0), life=26, radius=3)
                            )
                        hit = True
                        break

                if hit:
                    continue

                if player.invincible == 0 and math.hypot(e.x - player.x, e.y - player.y) < e.size + 14:
                    enemies.remove(e)
                    lives -= 1
                    player.invincible = 90
                    for _ in range(30):
                        particles.append(Particle(player.x, player.y, color=NEON_PINK, speed_range=(2.0, 6.5), life=28, radius=3))
                    if lives <= 0:
                        game_over = True

        for s in stars:
            s[1] += s[2]
            if s[1] > HEIGHT:
                s[1] = 0
                s[0] = random.randint(0, WIDTH)

        for ast in asteroids:
            ast.update()

        for p in particles[:]:
            p.update()
            if p.life <= 0:
                particles.remove(p)

        screen.blit(bg_surface, (0, 0))
        glow_surf = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)

        for s in stars:
            pygame.draw.circle(screen, (200, 180, 255), (int(s[0]), int(s[1])), 1)

        for ast in asteroids:
            ast.draw(screen)

        for p in particles:
            p.draw(glow_surf)

        for b in bullets:
            b.draw(screen, glow_surf)

        for e in enemies:
            e.draw(screen, glow_surf)

        if not game_over:
            player.draw(screen, glow_surf)

        screen.blit(glow_surf, (0, 0))

        pygame.draw.rect(screen, PURPLE, (0, 0, WIDTH, HEIGHT), 4)
        pygame.draw.rect(screen, (200, 120, 255), (1, 1, WIDTH - 2, HEIGHT - 2), 1)

        score_text = font_ui.render(f"SCORE: {score}", True, WHITE)
        screen.blit(score_text, (14, 12))

        lives_text = font_ui.render("LIVES:", True, WHITE)
        screen.blit(lives_text, (WIDTH - 145, 12))
        for i in range(lives):
            draw_heart(screen, WIDTH - 65 + i * 22, 21)

        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 140))
            screen.blit(overlay, (0, 0))

            go_text = font_big.render("GAME OVER", True, RED)
            restart_text = font_small.render("Press R to Restart", True, WHITE)
            screen.blit(go_text, (WIDTH // 2 - go_text.get_width() // 2, HEIGHT // 2 - 35))
            screen.blit(restart_text, (WIDTH // 2 - restart_text.get_width() // 2, HEIGHT // 2 + 15))

        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()
`;
